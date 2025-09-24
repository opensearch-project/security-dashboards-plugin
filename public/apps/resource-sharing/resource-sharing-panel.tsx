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

import React, { useEffect, useMemo, useState } from 'react';
import {
  EuiBasicTable,
  EuiBadge,
  EuiButton,
  EuiButtonEmpty,
  EuiCallOut,
  EuiComboBox,
  EuiFlexGroup,
  EuiFlexItem,
  EuiForm,
  EuiFormRow,
  EuiModal,
  EuiModalBody,
  EuiModalFooter,
  EuiModalHeader,
  EuiModalHeaderTitle,
  EuiPanel,
  EuiSpacer,
  EuiText,
  EuiToolTip,
  EuiSuperSelect,
  EuiSuperSelectOption,
} from '@elastic/eui';

import type { CoreStart } from '../../../../../src/core/public';

interface CreatedBy {
  user: string;
  tenant?: string;
}

interface ShareRecipients {
  users?: string[];
  roles?: string[];
  backend_roles?: string[];
}

type ShareWith = Record<string /* action-group e.g. READ_ONLY */, ShareRecipients>;

interface ResourceRow {
  resource_id: string;
  resource_type: string;
  created_by: CreatedBy;
  share_with?: ShareWith; // may be empty/undefined
  can_share?: boolean; // whether the current user can share this resource
}
interface TypeEntry {
  type: string; // type of resource, e.g. `sample-resource`
  action_groups: string[]; // known action-groups for this type
}
// Tiny API that the panel consumes
interface Api {
  listTypes: () => Promise<{ types: TypeEntry[] } | TypeEntry[]>;
  listSharingRecords: (type: string) => Promise<ResourceRow[] | { resources: ResourceRow[] } | any>;
  getSharingRecord: (
    id: string,
    type: string
  ) => Promise<ResourceRow | { resource: ResourceRow } | any>;
  share: (payload: {
    resource_id: string;
    resource_type: string;
    share_with: ShareWith;
  }) => Promise<any>;
  update: (payload: {
    resource_id: string;
    resource_type: string;
    add?: ShareWith;
    revoke?: ShareWith;
  }) => Promise<any>;
}

interface Props {
  api: Api;
  toasts: CoreStart['notifications']['toasts'];
}

const hasSharingInfo = (sw?: ShareWith) =>
  !!sw &&
  Object.values(sw).some(
    (v) => !!v && (v.users?.length || v.roles?.length || v.backend_roles?.length)
  );

/** ---------- helpers: UI <-> payload ---------- */
const toOptions = (vals?: string[]) => (vals || []).map((v) => ({ label: v }));
const fromOptions = (opts: Array<{ label: string }>) => opts.map((o) => o.label);
const cloneShareWith = (sw?: ShareWith): ShareWith => JSON.parse(JSON.stringify(sw || {}));

/** diff: produce { add, revoke } between old and next (both are ShareWith) */
function diffShareWith(prev: ShareWith, next: ShareWith): { add?: ShareWith; revoke?: ShareWith } {
  const add: ShareWith = {};
  const revoke: ShareWith = {};
  const allGroups = new Set<string>([...Object.keys(prev || {}), ...Object.keys(next || {})]);

  for (const g of allGroups) {
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

const extractHttpErrorLines = (e: any): string[] => {
  const lines: string[] = [];

  // 1) Basic status / message
  if (e?.response?.status || e?.response?.statusText) {
    lines.push(`${e?.response?.status ?? ''} ${e?.response?.statusText ?? ''}`.trim());
  }
  if (e?.message && e.message !== e?.response?.statusText) lines.push(e.message);

  // 2) Known body shapes
  let body: any = e?.body;
  if (typeof body === 'string') body = parseMaybeJson(body) ?? { raw: body };

  // OSD style: { statusCode, error, message }
  if (body?.statusCode || body?.error || body?.message) {
    if (body?.error && typeof body.error === 'string') lines.push(body.error);
    if (body?.message && typeof body.message === 'string') lines.push(body.message);
  }

  // OpenSearch style: { error: { reason, root_cause[], caused_by }, status }
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

  // Validation shapes: { details: [...]/violations: [...] }
  const details = body?.details || body?.violations;
  if (Array.isArray(details)) {
    for (const d of details) {
      if (typeof d === 'string') lines.push(d);
      else if (d?.message) lines.push(d.message);
      else if (d?.reason) lines.push(d.reason);
    }
  }

  // Raw fallback if we only had a string body
  if (body?.raw && typeof body.raw === 'string') {
    lines.push(body.raw);
  }

  // Dedup & clean
  return [...new Set(lines.filter(Boolean).map((s) => String(s).trim()))].slice(0, 10);
};

/** ---------- Share/Update modal ---------- */

interface ModalProps {
  mode: 'create' | 'edit';
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: any) => Promise<void>;
  resource: ResourceRow;
  resourceType: string;
  resourceTypeIndex: string;
  actionGroups: string[];
}

const hasNonEmptyRecipients = (r?: ShareRecipients) =>
  !!r && !!((r.users?.length ?? 0) || (r.roles?.length ?? 0) || (r.backend_roles?.length ?? 0));

const hasNonEmptyShareWith = (sw?: ShareWith) =>
  Object.values(sw || {}).some(hasNonEmptyRecipients);

const emptyGroups = (sw?: ShareWith) =>
  Object.entries(sw || {})
    .filter(([, r]) => !hasNonEmptyRecipients(r))
    .map(([g]) => g);

const ShareAccessModal: React.FC<ModalProps> = ({
  mode,
  isOpen,
  onClose,
  onSubmit,
  resource,
  resourceType,
  resourceTypeIndex,
  actionGroups,
}) => {
  const original = useMemo(() => cloneShareWith(resource?.share_with), [resource?.share_with]);
  const [working, setWorking] = useState<ShareWith>(() =>
    mode === 'edit' ? cloneShareWith(resource.share_with) : {}
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorLines, setErrorLines] = useState<string[]>([]);

  useEffect(() => {
    if (mode === 'edit') setWorking(cloneShareWith(resource.share_with));
    else setWorking({});
    setErrorLines([]);
  }, [mode, resource]);

  const groups = Object.keys(working);
  // suggestions list for this modal (unique + keep order)
  const SUGGESTIONS = useMemo(() => Array.from(new Set(actionGroups ?? [])), [actionGroups]);

  const addGroup = () => {
    // If no suggestions were provided for this type, do nothing.
    if (!SUGGESTIONS.length) {
      // Optional: show a subtle warning/toast instead of silent no-op
      // toasts?.addWarning?.('No predefined action-groups for this type');
      return;
    }

    // Pick the first unused suggestion
    const base = SUGGESTIONS.find((g) => !groups.includes(g));
    if (!base) return; // all suggestions already used

    setWorking({ ...working, [base]: {} });
  };

  const removeGroup = (g: string) => {
    const next = cloneShareWith(working);
    delete next[g];
    setWorking(next);
  };

  const setGroupName = (g: string, newName: string) => {
    if (!newName || newName === g) return;
    if (working[newName]) return;
    const copy = cloneShareWith(working);
    copy[newName] = copy[g] || {};
    delete copy[g];
    setWorking(copy);
  };

  const setRecipients = (g: string, key: keyof ShareRecipients, values: string[]) => {
    setWorking((prev) => ({
      ...prev,
      [g]: {
        ...(prev[g] || {}),
        [key]: values,
      },
    }));
  };

  // compute whether there are changes
  const diff = useMemo(() => diffShareWith(original || {}, working || {}), [original, working]);
  const groupsWithNoRecipients = useMemo(() => emptyGroups(working), [working]);
  const hasChanges =
    mode === 'create' ? hasNonEmptyShareWith(working) : Boolean(diff.add || diff.revoke);
  const isInvalid = groupsWithNoRecipients.length > 0;
  const disabledReason = !hasChanges
    ? mode === 'create'
      ? 'Add at least one user, role, or backend role to share.'
      : 'No changes detected.'
    : isInvalid
    ? `These action-groups have no recipients: ${groupsWithNoRecipients.join(', ')}`
    : undefined;

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setErrorLines([]);
    try {
      if (mode === 'create') {
        await onSubmit({
          resource_id: resource.resource_id,
          resource_type: resourceTypeIndex,
          share_with: working,
        });
      } else {
        if (!diff.add && !diff.revoke) {
          // Shouldn’t happen since button is hidden, but safe-guard anyway
          setIsSubmitting(false);
          return;
        }
        const payload: any = {
          resource_id: resource.resource_id,
          resource_type: resourceTypeIndex,
          ...(diff.add ? { add: diff.add } : {}),
          ...(diff.revoke ? { revoke: diff.revoke } : {}),
        };
        await onSubmit(payload);
      }
      onClose();
    } catch (e: any) {
      const lines = extractHttpErrorLines(e);
      setErrorLines(lines.length ? lines : ['Failed to submit changes.']);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <EuiModal onClose={onClose} style={{ width: 700 }}>
      <EuiModalHeader>
        <EuiModalHeaderTitle>
          {mode === 'create' ? 'Share Resource' : 'Update Access'}
        </EuiModalHeaderTitle>
      </EuiModalHeader>
      <EuiModalBody>
        <EuiText size="s">
          <p>
            <strong>Resource:</strong> {resource.resource_id} &nbsp;·&nbsp; <strong>Type:</strong>{' '}
            {resourceType}
          </p>
        </EuiText>
        <EuiSpacer size="m" />
        {!isSubmitting && errorLines.length > 0 && (
          <>
            <EuiCallOut title="Request failed" color="danger" iconType="alert">
              <ul style={{ margin: 0, paddingLeft: 18 }}>
                {errorLines.map((l, i) => (
                  <li key={i}>{l}</li>
                ))}
              </ul>
            </EuiCallOut>
            <EuiSpacer />
          </>
        )}
        {isInvalid && (
          <>
            <EuiCallOut title="Add recipients" color="warning" iconType="alert">
              The following action-groups have no recipients: {groupsWithNoRecipients.join(', ')}
            </EuiCallOut>
            <EuiSpacer size="s" />
          </>
        )}
        <EuiForm component="form">
          <EuiFormRow label="Action-groups">
            <EuiButtonEmpty iconType="plusInCircle" onClick={addGroup}>
              Add action-group
            </EuiButtonEmpty>
          </EuiFormRow>

          {Object.keys(working).length === 0 && (
            <EuiText color="subdued" size="s">
              No action-groups added yet.
            </EuiText>
          )}

          {Object.entries(working).map(([groupName, recipients]) => {
            const groupOptions = [...new Set([groupName, ...SUGGESTIONS])].map((l) => ({
              label: l,
            }));

            return (
              <EuiPanel key={groupName} paddingSize="m" hasShadow={false} hasBorder>
                <EuiFlexGroup gutterSize="m" alignItems="center">
                  <EuiFlexItem grow={3}>
                    <EuiFormRow label="Action-group">
                      <EuiComboBox
                        singleSelection={{ asPlainText: true }}
                        options={groupOptions}
                        selectedOptions={[{ label: groupName }]}
                        onChange={(opts) => {
                          const newLabel = opts[0]?.label || groupName;
                          setGroupName(groupName, newLabel);
                        }}
                        onCreateOption={(label: string) => setGroupName(groupName, label)}
                      />
                    </EuiFormRow>
                  </EuiFlexItem>
                  <EuiFlexItem grow={false}>
                    <EuiButtonEmpty
                      color="danger"
                      iconType="trash"
                      onClick={() => removeGroup(groupName)}
                    >
                      Remove
                    </EuiButtonEmpty>
                  </EuiFlexItem>
                </EuiFlexGroup>

                <EuiFormRow label="Users">
                  <EuiComboBox
                    placeholder="Add users…"
                    noSuggestions
                    selectedOptions={toOptions(recipients.users)}
                    onCreateOption={(v) =>
                      setRecipients(groupName, 'users', [...(recipients.users || []), v])
                    }
                    onChange={(opts) => setRecipients(groupName, 'users', fromOptions(opts))}
                  />
                </EuiFormRow>
                <EuiFormRow label="Roles">
                  <EuiComboBox
                    placeholder="Add roles…"
                    noSuggestions
                    selectedOptions={toOptions(recipients.roles)}
                    onCreateOption={(v) =>
                      setRecipients(groupName, 'roles', [...(recipients.roles || []), v])
                    }
                    onChange={(opts) => setRecipients(groupName, 'roles', fromOptions(opts))}
                  />
                </EuiFormRow>
                <EuiFormRow label="Backend roles">
                  <EuiComboBox
                    placeholder="Add backend roles…"
                    noSuggestions
                    selectedOptions={toOptions(recipients.backend_roles)}
                    onCreateOption={(v) =>
                      setRecipients(groupName, 'backend_roles', [
                        ...(recipients.backend_roles || []),
                        v,
                      ])
                    }
                    onChange={(opts) =>
                      setRecipients(groupName, 'backend_roles', fromOptions(opts))
                    }
                  />
                </EuiFormRow>
              </EuiPanel>
            );
          })}
        </EuiForm>
      </EuiModalBody>
      <EuiModalFooter>
        <EuiButtonEmpty onClick={onClose} isDisabled={isSubmitting}>
          Cancel
        </EuiButtonEmpty>
        <EuiToolTip content={disabledReason}>
          <EuiButton
            onClick={handleSubmit}
            fill
            isLoading={isSubmitting}
            isDisabled={!hasChanges || isInvalid || isSubmitting}
          >
            {mode === 'create' ? 'Share' : 'Update Access'}
          </EuiButton>
        </EuiToolTip>
      </EuiModalFooter>
    </EuiModal>
  );
};

/** ---------- Expanded view for Shared With ---------- */
const SharedWithExpanded: React.FC<{ sw?: ShareWith }> = ({ sw }) => {
  if (!hasSharingInfo(sw)) {
    return (
      <EuiText size="s" color="subdued">
        Not shared.
      </EuiText>
    );
  }
  return (
    <EuiText size="s">
      {Object.entries(sw || {}).map(([ag, r]) => (
        <div key={ag} style={{ marginBottom: 8 }}>
          <EuiText>
            <strong>Action-group:</strong> {ag}
          </EuiText>
          <div style={{ paddingLeft: 12 }}>
            <div>
              <strong>Users:</strong> {(r.users || []).join(', ') || '—'}
            </div>
            <div>
              <strong>Roles:</strong> {(r.roles || []).join(', ') || '—'}
            </div>
            <div>
              <strong>Backend Roles:</strong> {(r.backend_roles || []).join(', ') || '—'}
            </div>
          </div>
        </div>
      ))}
    </EuiText>
  );
};

// Helpers: pick simple name and humanize it
const simpleName = (type?: string) =>
  (
    (type ?? '')
      .split('.')
      .filter(Boolean) // remove empty parts from trailing dots, etc.
      .pop() ?? ''
  ).trim();

/** Humanize class names: e.g., "AnomalyDetector" -> "Anomaly Detector", "ADDetector" -> "AD Detector",
 *  and kebab/underscore: "sample-resource" -> "Sample Resource", "anomaly-detector" -> "Anomaly Detector"
 */
const normalizeResourceTypeName = (t: string) => {
  const type = simpleName(t);

  // 1) Insert spaces at camel/acronym boundaries, and normalize separators to spaces
  let s = type
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2') // "ADDetector" -> "AD Detector"
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2') // "AnomalyDetector" -> "Anomaly Detector"
    .replace(/[-_]+/g, ' ') // "sample-resource" / "sample_resource" -> "sample resource"
    .replace(/\s+/g, ' ') // collapse multiple spaces
    .trim();

  // 2) Title-case tokens that are all-lowercase; keep existing caps/acronyms as-is.
  s = s.replace(/\b([a-z])([a-z0-9]*)\b/g, (_, a, rest) => a.toUpperCase() + rest);

  return s;
};

/** ---------- Main table ---------- */
export const ResourceSharingPanel: React.FC<Props> = ({ api, toasts }) => {
  const [typeOptions, setTypeOptions] = useState<
    Array<{ value: string; text: string; actionGroups: string[] }>
  >([]);
  const [selectedType, setSelectedType] = useState<string>(''); // no default selection
  const [rows, setRows] = useState<ResourceRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [typesLoading, setTypesLoading] = useState(false);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [modalState, setModalState] = useState<{
    open: boolean;
    mode: 'create' | 'edit';
    resource?: ResourceRow;
  }>({ open: false, mode: 'create' });

  /** Page load: ONLY fetch types. Do NOT preselect or fetch rows. */
  useEffect(() => {
    (async () => {
      setTypesLoading(true);
      try {
        const res = await api.listTypes();
        const raw: TypeEntry[] = Array.isArray(res) ? res : res?.types || [];
        // value = index (what we send as resourceType); text = type (what we display)
        const options = raw
          .map((t) => ({
            value: t.type,
            text: normalizeResourceTypeName(t.type),
            actionGroups: t.action_groups,
          }))
          // sort alphabetically by text (and by value if text is equal)
          .sort((a, b) => {
            const byText = a.text.localeCompare(b.text, undefined, { sensitivity: 'base' });
            return byText !== 0
              ? byText
              : a.value.localeCompare(b.value, undefined, { sensitivity: 'base' });
          });
        setTypeOptions(options);
      } catch (e: any) {
        toasts.addError(e, { title: 'Failed to load types' });
      } finally {
        setTypesLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toasts]);

  // GET visible resource sharing records for selected type
  const fetchSharingRecords = async (type: string) => {
    setLoading(true);
    try {
      const res = await api.listSharingRecords(type);
      const data: ResourceRow[] = Array.isArray(res) ? res : res?.resources || res?.body || [];
      setRows(Array.isArray(data) ? data : []);
    } catch (e: any) {
      toasts.addError(e, { title: 'Failed to load resources' });
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  const selectedTypeMeta = useMemo(() => typeOptions.find((o) => o.value === selectedType), [
    typeOptions,
    selectedType,
  ]);
  const selectedTypeLabel = selectedTypeMeta?.text ?? (selectedType || '—');
  const selectedTypeTooltip = selectedTypeMeta?.value; // actual resource type

  const currentActionGroups = useMemo(
    () => Array.from(new Set(selectedTypeMeta?.actionGroups ?? [])).sort(),
    [selectedTypeMeta]
  );

  const columns = [
    // id column
    {
      field: 'resource_id',
      name: 'Resource ID',
      render: (v: string) => (
        <EuiText size="s">
          <code>{v}</code>
        </EuiText>
      ),
    },

    // type column:  Derived from the dropdown: label from typeOptions, tooltip shows the full-qualified class-name
    {
      name: 'Resource Type',
      render: () => (
        <EuiToolTip content={selectedTypeTooltip}>
          <EuiText size="s">{selectedTypeLabel}</EuiText>
        </EuiToolTip>
      ),
    },

    // Owner from created_by.user
    {
      name: 'Owner',
      render: (item: ResourceRow) => item.created_by.user ?? '—',
    },

    // Tenant column from created_by.tenant
    {
      name: 'Tenant',
      render: (item: ResourceRow) => item.created_by.tenant ?? '—',
    },
    // current Shared with info column
    {
      name: 'Shared With',
      render: (item: ResourceRow) => {
        const summary = hasSharingInfo(item.share_with)
          ? `${Object.keys(item.share_with || {}).length} action-group(s)`
          : 'Not shared';
        const isOpen = expandedIds.has(item.resource_id);

        return (
          <EuiFlexGroup gutterSize="s" alignItems="center">
            <EuiFlexItem grow={false}>
              <EuiBadge color={hasSharingInfo(item.share_with) ? 'primary' : 'hollow'}>
                {summary}
              </EuiBadge>
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <EuiButtonEmpty
                size="s"
                onClick={() => {
                  setExpandedIds((prev) => {
                    const next = new Set(prev);
                    if (next.has(item.resource_id)) next.delete(item.resource_id);
                    else next.add(item.resource_id);
                    return next;
                  });
                }}
              >
                {isOpen ? 'Hide' : 'View'}
              </EuiButtonEmpty>
            </EuiFlexItem>
          </EuiFlexGroup>
        );
      },
    },
    // Actions column
    {
      name: 'Actions',
      render: (item: ResourceRow) => {
        const label = hasSharingInfo(item.share_with) ? 'Update Access' : 'Share';
        const canShare = item.can_share === true;

        const handleClick = () => {
          if (!canShare) return;
          setModalState({
            open: true,
            mode: hasSharingInfo(item.share_with) ? 'edit' : 'create',
            resource: item,
          });
        };

        const btn = (
          <EuiButton
            size="s"
            isDisabled={!canShare}
            data-test-subj={`share-button-${item.resource_id}`}
            onClick={handleClick}
          >
            {label}
          </EuiButton>
        );

        // Show tooltip only when disabled
        return canShare ? (
          btn
        ) : (
          <EuiToolTip content="You do not have access to update sharing information of this resource">
            <span>{btn}</span>
          </EuiToolTip>
        );
      },
    },
  ];

  // Show items in expanded view
  const itemIdToExpandedRowMap = useMemo(() => {
    const map: Record<string, React.ReactNode> = {};
    for (const r of rows) {
      if (expandedIds.has(r.resource_id)) {
        map[r.resource_id] = <SharedWithExpanded sw={r.share_with} />;
      }
    }
    return map;
  }, [rows, expandedIds]);

  const handleSubmitModal = async (payload: any) => {
    if (modalState.mode === 'create') {
      await api.share(payload);
      toasts.addSuccess('Resource shared.');
    } else {
      await api.update(payload);
      toasts.addSuccess('Access updated.');
    }
    await fetchSharingRecords(selectedType);
  };

  // Build the type options for EuiSuperSelect
  // We add a placeholder option at the top if no selection has been made yet (i.e. selectedType is empty)
  // EuiSuperSelect, softlinked to oui, doesn't seem to support a placeholder prop directly.
  // See: https://oui.opensearch.org/1.21/#/forms/super-select
  const PLACEHOLDER = '__placeholder__';
  const baseOptions = useMemo<Array<EuiSuperSelectOption<string>>>(
    () =>
      typeOptions.map((o) => ({
        value: o.value, // type name to send to backend
        inputDisplay: o.text, // humanized label when selected
        dropdownDisplay: <span title={o.value}>{o.text}</span>, // show original resource-type on hover
      })),
    [typeOptions]
  );

  // Only include the placeholder option BEFORE a selection is made
  const superOptions = useMemo<Array<EuiSuperSelectOption<string>>>(
    () =>
      selectedType
        ? baseOptions
        : [
            {
              value: PLACEHOLDER,
              disabled: true,
              inputDisplay: 'Select a type…',
              dropdownDisplay: <span>Select a type…</span>,
            },
            ...baseOptions,
          ],
    [baseOptions, selectedType]
  );

  const valueOfSelected = selectedType.length === 0 ? PLACEHOLDER : selectedType;

  return (
    <EuiPanel paddingSize="m">
      <EuiFlexGroup gutterSize="m" alignItems="center">
        <EuiFlexItem grow={false}>
          <EuiText>
            <h3>Resources</h3>
          </EuiText>
        </EuiFlexItem>
        <EuiFlexItem grow />
        <EuiFlexItem grow={false} style={{ minWidth: 280 }}>
          <EuiSuperSelect
            options={superOptions}
            valueOfSelected={valueOfSelected}
            disabled={typesLoading}
            itemLayoutAlign="top"
            fullWidth
            hasDividers
            onChange={async (value) => {
              if (value === PLACEHOLDER) return;
              const resourceType = value;
              setSelectedType(resourceType);
              setExpandedIds(new Set());
              setRows([]);
              if (resourceType) await fetchSharingRecords(resourceType);
            }}
          />
        </EuiFlexItem>
      </EuiFlexGroup>

      {/* No type chosen yet: show guidance message and don't render the table */}
      {!selectedType ? (
        <>
          {typesLoading ? (
            <EuiCallOut title="Loading types…" color="primary" iconType="iInCircle" />
          ) : typeOptions.length === 0 ? (
            <EuiCallOut title="No types available" color="warning" iconType="alert">
              No resource types are available for sharing. Please ensure that you have created
              resources that support sharing.
            </EuiCallOut>
          ) : (
            <EuiCallOut
              title="Select a type to view resources"
              color="primary"
              iconType="iInCircle"
            >
              Pick a resource type from the dropdown to load accessible resources.
            </EuiCallOut>
          )}
        </>
      ) : (
        <EuiBasicTable<ResourceRow>
          items={rows}
          loading={loading}
          columns={columns}
          itemId="resource_id"
          isExpandable
          itemIdToExpandedRowMap={itemIdToExpandedRowMap}
          tableLayout="auto"
          rowProps={(item) => ({ 'data-test-subj': `row-${item.resource_id}` })}
        />
      )}

      <ShareAccessModal
        mode={modalState.mode}
        isOpen={modalState.open}
        onClose={() => setModalState({ open: false, mode: 'create', resource: undefined })}
        onSubmit={handleSubmitModal}
        resource={modalState.resource as ResourceRow}
        resourceType={selectedTypeLabel}
        resourceTypeIndex={selectedType}
        actionGroups={currentActionGroups}
      />
    </EuiPanel>
  );
};
