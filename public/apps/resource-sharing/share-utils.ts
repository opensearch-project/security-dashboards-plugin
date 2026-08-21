/*
 *   Copyright OpenSearch Contributors
 *
 *   Licensed under the Apache License, Version 2.0 (the "License").
 *   You may not use this file except in compliance with the License.
 *   A copy of the License is located at
 *
 *       http://www.apache.org/licenses/LICENSE-2.0
 *
 *   or in the "license" file accompanying this file. This file is distributed
 *   on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either
 *   express or implied. See the License for the specific language governing
 *   permissions and limitations under the License.
 */

import { ShareRecipients, ShareWith } from './types';

export const hasSharingInfo = (sw?: ShareWith) =>
  !!sw &&
  Object.values(sw).some(
    (v) => !!v && (v.users?.length || v.roles?.length || v.backend_roles?.length)
  );

/**
 * Counts the distinct principals a resource is shared with across all access
 * levels. A principal shared at multiple levels is counted once. Used for the
 * "Shared with N" status indicator.
 */
export const countSharedPrincipals = (sw?: ShareWith): number => {
  const seen = new Set<string>();
  for (const recipients of Object.values(sw || {})) {
    (recipients?.users || []).forEach((u) => seen.add(`u:${u}`));
    (recipients?.roles || []).forEach((r) => seen.add(`r:${r}`));
    (recipients?.backend_roles || []).forEach((b) => seen.add(`b:${b}`));
  }
  return seen.size;
};

/** ---------- helpers: UI <-> payload ---------- */
export const toOptions = (vals?: string[]) => (vals || []).map((v) => ({ label: v }));
export const fromOptions = (opts: Array<{ label: string }>) => opts.map((o) => o.label);
export const cloneShareWith = (sw?: ShareWith): ShareWith => JSON.parse(JSON.stringify(sw || {}));

/** diff: produce { add, revoke } between old and next (both are ShareWith): for PUT/PATCH api calls */
export function diffShareWith(
  prev: ShareWith,
  next: ShareWith
): { add?: ShareWith; revoke?: ShareWith } {
  const add: ShareWith = {};
  const revoke: ShareWith = {};
  const allLevels = new Set<string>([...Object.keys(prev || {}), ...Object.keys(next || {})]);

  for (const g of allLevels) {
    const p = prev?.[g] || {};
    const n = next?.[g] || {};
    const keys: Array<keyof ShareRecipients> = ['users', 'roles', 'backend_roles'];

    for (const k of keys) {
      const pSet = new Set(p[k] || []);
      const nSet = new Set(n[k] || []);

      const adds = [...nSet].filter((x) => !pSet.has(x));
      if (adds.length) {
        add[g] = add[g] || {};
        (add[g] as any)[k] = [...((add[g] as any)[k] || []), ...adds];
      }

      const removals = [...pSet].filter((x) => !nSet.has(x));
      if (removals.length) {
        revoke[g] = revoke[g] || {};
        (revoke[g] as any)[k] = [...((revoke[g] as any)[k] || []), ...removals];
      }
    }
  }

  const empty = (sw: ShareWith) =>
    !Object.keys(sw).length ||
    Object.values(sw).every(
      (v) => !v.users?.length && !v.roles?.length && !v.backend_roles?.length
    );

  return { add: empty(add) ? undefined : add, revoke: empty(revoke) ? undefined : revoke };
}

/** ----- Share Modal error helper ------ */
const parseMaybeJson = (s: unknown) => {
  if (typeof s !== 'string') return undefined;
  try {
    return JSON.parse(s);
  } catch {
    return undefined;
  }
};

export const extractHttpErrorLines = (e: any): string[] => {
  const lines: string[] = [];

  // 1) Basic status / message
  if (e?.response?.status || e?.response?.statusText) {
    lines.push(`${e?.response?.status ?? ''} ${e?.response?.statusText ?? ''}`.trim());
  }
  if (e?.message && e.message !== e?.response?.statusText) lines.push(e.message);

  // 2) Known body shapes
  let body: any = e?.body;
  if (typeof body === 'string') body = parseMaybeJson(body) ?? { raw: body };

  // OSD style Error: { statusCode, error, message }
  if (body?.statusCode || body?.error || body?.message) {
    if (body?.error && typeof body.error === 'string') lines.push(body.error);
    if (body?.message && typeof body.message === 'string') lines.push(body.message);
  }

  // OpenSearch style Error: { error: { reason, root_cause[], caused_by }, status }
  const osErr = body?.error;
  if (osErr) {
    if (typeof osErr.reason === 'string') lines.push(osErr.reason);
    if (osErr.caused_by?.reason) lines.push(osErr.caused_by.reason);
    if (Array.isArray(osErr.root_cause)) {
      for (const rc of osErr.root_cause) {
        if (rc?.reason) lines.push(rc.reason);
      }
    }
    if (Array.isArray(osErr.caused_by?.root_cause)) {
      for (const rc of osErr.caused_by.root_cause) {
        if (rc?.reason) lines.push(rc.reason);
      }
    }
  }

  // Raw fallback if we only had a string body
  if (body?.raw && typeof body.raw === 'string') {
    lines.push(body.raw);
  }

  // Dedup & clean
  return [...new Set(lines.filter(Boolean).map((s) => String(s).trim()))].slice(0, 10);
};

export const hasNonEmptyRecipients = (r?: ShareRecipients) =>
  !!r && !!((r.users?.length ?? 0) || (r.roles?.length ?? 0) || (r.backend_roles?.length ?? 0));

export const hasNonEmptyShareWith = (sw?: ShareWith) =>
  Object.values(sw || {}).some(hasNonEmptyRecipients);

export const emptyLevels = (sw?: ShareWith) =>
  Object.entries(sw || {})
    .filter(([, r]) => !hasNonEmptyRecipients(r))
    .map(([g]) => g);

/**
 * Translates a raw access-level token (e.g. `ad_read_only`,
 * `workflow_full_access`) into plain language for display. The raw token
 * remains the value submitted to the backend. Unknown patterns fall back to
 * title-cased words.
 */
export function humanizeAccessLevel(level: string): string {
  if (!level) return level;
  const normalized = level.toLowerCase();
  const suffixes: Array<[RegExp, string]> = [
    [/(^|_)read_only$/, 'Read only'],
    [/(^|_)read_write$/, 'Read & write'],
    [/(^|_)full_access$/, 'Full access'],
    [/(^|_)read$/, 'Read only'],
    [/(^|_)write$/, 'Read & write'],
  ];
  for (const [pattern, label] of suffixes) {
    if (pattern.test(normalized)) return label;
  }
  // Fallback: title-case the words, e.g. `custom_level` -> `Custom level`
  const words = level.replace(/[-_]+/g, ' ').trim();
  return words.charAt(0).toUpperCase() + words.slice(1);
}
