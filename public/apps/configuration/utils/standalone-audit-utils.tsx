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

import { HttpStart } from 'opensearch-dashboards/public';
import { get, set } from 'lodash';
import { StandaloneAuditSettings } from '../panels/standalone-audit/types';
import { CLUSTER_SETTINGS_KEY_MAP } from '../panels/standalone-audit/constants';
import { API_ENDPOINT_STANDALONE_AUDIT, API_ENDPOINT_STANDALONE_AUDIT_UPDATE } from '../constants';
import { createRequestContextWithDataSourceId } from './request-utils';

/**
 * Raw shape returned by `_cluster/settings?include_defaults=true&flat_settings=true`.
 * Each section is a flat map of setting-key -> value.
 */
interface ClusterSettingsResponse {
  persistent?: { [key: string]: unknown };
  transient?: { [key: string]: unknown };
  defaults?: { [key: string]: unknown };
}

function coerceBool(value: unknown): boolean | undefined {
  if (typeof value === 'boolean') return value;
  if (value === 'true') return true;
  if (value === 'false') return false;
  return undefined;
}

/**
 * Reads a list-valued setting from a flat cluster-settings map. `_cluster/settings` may
 * represent lists as a JSON array under the flat key, as a comma-separated string, or as
 * indexed keys (key.0, key.1, ...). Handle all three defensively.
 *
 * TODO: verify the exact array representation against a live cluster and simplify.
 */
function coerceArray(flat: { [key: string]: unknown }, key: string): string[] | undefined {
  const direct = flat[key];
  if (Array.isArray(direct)) {
    return direct.map(String);
  }
  if (typeof direct === 'string') {
    return direct.length
      ? direct
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
      : [];
  }

  const prefix = `${key}.`;
  const indexedKeys = Object.keys(flat)
    .filter((k) => k.startsWith(prefix) && /^\d+$/.test(k.slice(prefix.length)))
    .sort((a, b) => Number(a.slice(prefix.length)) - Number(b.slice(prefix.length)));

  return indexedKeys.length ? indexedKeys.map((k) => String(flat[k])) : undefined;
}

/**
 * Merge the three cluster-settings sections into one flat map. Precedence follows how
 * OpenSearch resolves effective values: defaults < persistent < transient.
 */
function mergeSections(raw: ClusterSettingsResponse): { [key: string]: unknown } {
  return {
    ...(raw.defaults || {}),
    ...(raw.persistent || {}),
    ...(raw.transient || {}),
  };
}

/**
 * Fetch standalone audit config from cluster settings and translate the flat keys into
 * the nested { enabled, audit, compliance } shape the UI renders.
 */
export async function getStandaloneAudit(
  http: HttpStart,
  dataSourceId: string
): Promise<StandaloneAuditSettings> {
  const raw = await createRequestContextWithDataSourceId(
    dataSourceId
  ).httpGet<ClusterSettingsResponse>({
    http,
    url: API_ENDPOINT_STANDALONE_AUDIT,
  });

  const flat = mergeSections(raw || {});
  const config: StandaloneAuditSettings = {};

  Object.entries(CLUSTER_SETTINGS_KEY_MAP).forEach(([uiPath, mapping]) => {
    const value =
      mapping.type === 'bool' ? coerceBool(flat[mapping.key]) : coerceArray(flat, mapping.key);
    if (value !== undefined) {
      set(config, uiPath, value);
    }
  });

  return config;
}

/**
 * Translate the nested UI config back into flat cluster-settings keys and persist them
 * via `PUT _cluster/settings` (as persistent settings, so they survive restarts).
 */
export async function updateStandaloneAudit(
  http: HttpStart,
  updateObject: StandaloneAuditSettings,
  dataSourceId: string
) {
  const persistent: { [key: string]: unknown } = {};

  Object.entries(CLUSTER_SETTINGS_KEY_MAP).forEach(([uiPath, mapping]) => {
    const value = get(updateObject, uiPath);
    if (value !== undefined) {
      persistent[mapping.key] = value;
    }
  });

  return await createRequestContextWithDataSourceId(dataSourceId).httpPost({
    http,
    url: API_ENDPOINT_STANDALONE_AUDIT_UPDATE,
    body: { persistent },
  });
}
