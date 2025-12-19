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
  EuiEmptyPrompt,
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

import _ from 'lodash';

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

type ShareWith = Record<string /* access-level e.g. READ_ONLY */, ShareRecipients>;

interface ResourceRow {
  resource_id: string;
  resource_type: string;
  created_by: CreatedBy;
  share_with?: ShareWith; // may be empty/undefined
  can_share?: boolean; // whether the current user can share this resource
}
interface TypeEntry {
  type: string; // type of resource, e.g. `sample-resource`
  access_levels: string[]; // known access-levels for this type
}

// API that the panel consumes
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

/** diff: produce { add, revoke } between old and next (both are ShareWith): for PUT/PATCH api calls */
function diffShareWith(prev: ShareWith, next: ShareWith): { add?: ShareWith; revoke?: ShareWith } {
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

/** ---------- Share/Update modal ---------- */

interface ModalProps {
  mode: 'create' | 'edit';
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: any) => Promise<void>;
  resource: ResourceRow;
  resourceType: string;
  resourceTypeIndex: string;
  accessLevels: string[];
}

const hasNonEmptyRecipients = (r?: ShareRecipients) =>
  !!r && !!((r.users?.length ?? 0) || (r.roles?.length ?? 0) || (r.backend_roles?.length ?? 0));

const hasNonEmptyShareWith = (sw?: ShareWith) =>
  Object.values(sw || {}).some(hasNonEmptyRecipients);

const emptyLevels = (sw?: ShareWith) =>
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
  accessLevels,
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

  const levels = Object.keys(working);
  // suggestions list for this modal (unique + keep order)
  const ACCESS_LEVELS = useMemo(() => Array.from(new Set(accessLevels ?? [])), [accessLevels]);

  const addLevel = () => {
    // If no suggestions were provided for this type, do nothing.
    if (!ACCESS_LEVELS.length) {
      return;
    }

    // Pick the first unused suggestion
    const base = ACCESS_LEVELS.find((level) => !levels.includes(level));
    if (!base) return; // all suggestions already used

    setWorking({ ...working, [base]: {} });
  };

  const removeLevel = (g: string) => {
    const next = cloneShareWith(working);
    delete next[g];
    setWorking(next);
  };

  const setLevelName = (g: string, newName: string) => {
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
  const levelsWithNoRecipients = useMemo(() => emptyLevels(working), [working]);
  const hasChanges =
    mode === 'create' ? hasNonEmptyShareWith(working) : Boolean(diff.add || diff.revoke);
  const isInvalid = levelsWithNoRecipients.length > 0;

  const disabledReason = (): string | undefined => {
    if (isInvalid) {
      return `These access-levels have no recipients: ${levelsWithNoRecipients.join(', ')}`;
    }

    if (!hasChanges) {
      return mode === 'create'
        ? 'Add at least one user, role, or backend role to share.'
        : 'No changes detected.';
    }

    return undefined;
  };

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
              The following access-levels have no recipients: {levelsWithNoRecipients.join(', ')}
            </EuiCallOut>
            <EuiSpacer size="s" />
          </>
        )}
        <EuiForm component="form">
          <EuiFormRow label="Access-levels">
            <EuiButtonEmpty iconType="plusInCircle" onClick={addLevel}>
              Add access-level
            </EuiButtonEmpty>
          </EuiFormRow>

          {Object.keys(working).length === 0 && (
            <EuiText color="subdued" size="s">
              No access-levels added yet.
            </EuiText>
          )}

          {Object.entries(working).map(([levelName, recipients]) => {
            const levelOptions = [...new Set([levelName, ...ACCESS_LEVELS])].map((l) => ({
              label: l,
            }));

            return (
              <EuiPanel key={levelName} paddingSize="m" hasShadow={false} hasBorder>
                <EuiFlexGroup gutterSize="m" alignItems="center">
                  <EuiFlexItem grow={3}>
                    <EuiFormRow label="Access-level">
                      <EuiComboBox
                        singleSelection={{ asPlainText: true }}
                        options={levelOptions}
                        selectedOptions={[{ label: levelName }]}
                        onChange={(opts) => {
                          const newLabel = opts[0]?.label || levelName;
                          setLevelName(levelName, newLabel);
                        }}
                        onCreateOption={(label: string) => setLevelName(levelName, label)}
                      />
                    </EuiFormRow>
                  </EuiFlexItem>
                  <EuiFlexItem grow={false}>
                    <EuiButtonEmpty
                      color="danger"
                      iconType="trash"
                      onClick={() => removeLevel(levelName)}
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
                      setRecipients(levelName, 'users', [...(recipients.users || []), v])
                    }
                    onChange={(opts) => setRecipients(levelName, 'users', fromOptions(opts))}
                  />
                </EuiFormRow>
                <EuiFormRow label="Roles">
                  <EuiComboBox
                    placeholder="Add roles…"
                    noSuggestions
                    selectedOptions={toOptions(recipients.roles)}
                    onCreateOption={(v) =>
                      setRecipients(levelName, 'roles', [...(recipients.roles || []), v])
                    }
                    onChange={(opts) => setRecipients(levelName, 'roles', fromOptions(opts))}
                  />
                </EuiFormRow>
                <EuiFormRow label="Backend roles">
                  <EuiComboBox
                    placeholder="Add backend roles…"
                    noSuggestions
                    selectedOptions={toOptions(recipients.backend_roles)}
                    onCreateOption={(v) =>
                      setRecipients(levelName, 'backend_roles', [
                        ...(recipients.backend_roles || []),
                        v,
                      ])
                    }
                    onChange={(opts) =>
                      setRecipients(levelName, 'backend_roles', fromOptions(opts))
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
        <EuiToolTip content={disabledReason()}>
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
      {Object.entries(sw || {}).map(([level, r]) => (
        <div key={level} style={{ marginBottom: 8 }}>
          <EuiText>
            <strong>Access-level:</strong> {level}
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

const SELECTED_TYPE_SESSION_KEY = 'security::resourceSharing::selectedType';

/** ---------- Main table ---------- */
export const ResourceSharingPanel: React.FC<Props> = ({ api, toasts }) => {
  const [typeOptions, setTypeOptions] = useState<
    Array<{ value: string; text: string; accessLevels: string[] }>
  >([]);
  const [selectedType, setSelectedType] = useState<string>(() => {
    return sessionStorage.getItem(SELECTED_TYPE_SESSION_KEY) || '';
  });
  const [rows, setRows] = useState<ResourceRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [typesLoading, setTypesLoading] = useState(false);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [modalState, setModalState] = useState<{
    open: boolean;
    mode: 'create' | 'edit';
    resource?: ResourceRow;
  }>({ open: false, mode: 'create' });

  // Persist selectedType to sessionStorage
  useEffect(() => {
    if (selectedType) {
      sessionStorage.setItem(SELECTED_TYPE_SESSION_KEY, selectedType);
    } else {
      sessionStorage.removeItem(SELECTED_TYPE_SESSION_KEY);
    }
  }, [selectedType]);

  /** Page load: Fetch types. Re-fetch when api (data source) changes. */
  useEffect(() => {
    (async () => {
      setTypesLoading(true);
      setRows([]);
      try {
        const res = await api.listTypes();
        const raw: TypeEntry[] = Array.isArray(res) ? res : res?.types || [];
        // value = type (what we send as resourceType); text = humanized type (what we display)
        const options = raw
          .map((t) => ({
            value: t.type,
            text: _.startCase(t.type),
            accessLevels: t.access_levels,
          }))
          // sort alphabetically by text (and by value if text is equal)
          .sort((a, b) => {
            const byText = a.text.localeCompare(b.text, undefined, { sensitivity: 'base' });
            return byText !== 0
              ? byText
              : a.value.localeCompare(b.value, undefined, { sensitivity: 'base' });
          });
        setTypeOptions(options);

        // If there's a saved selectedType and it exists in the new options, fetch its records
        const savedType = sessionStorage.getItem(SELECTED_TYPE_SESSION_KEY);
        if (savedType && options.some((o) => o.value === savedType)) {
          setSelectedType(savedType);
          // Fetch records for the saved type
          setLoading(true);
          try {
            const recordsRes = await api.listSharingRecords(savedType);
            const data: ResourceRow[] = Array.isArray(recordsRes)
              ? recordsRes
              : recordsRes?.resources || recordsRes?.body || [];
            setRows(Array.isArray(data) ? data : []);
          } catch (e: any) {
            toasts.addError(e, { title: 'Failed to load resources' });
            setRows([]);
          } finally {
            setLoading(false);
          }
        } else {
          // Clear saved type if it doesn't exist in new data source
          setSelectedType('');
        }
      } catch (e: any) {
        toasts.addError(e, { title: 'Failed to load types' });
      } finally {
        setTypesLoading(false);
      }
    })();
  }, [api, toasts]);

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

  const currentAccessLevels = useMemo(
    () => Array.from(new Set(selectedTypeMeta?.accessLevels ?? [])).sort(),
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

    // type column:  Derived from the dropdown: label from typeOptions, tooltip shows the original type
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
        const size = Object.keys(item.share_with || {}).length;
        const levelCountMessage = `${size} access-level${size > 1 ? 's' : ''}`;
        const summary = hasSharingInfo(item.share_with) ? levelCountMessage : 'Not shared';
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
            <h3>Resources{selectedType ? ` (${rows?.length ?? 0})` : ''}</h3>
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
            <EuiEmptyPrompt
              iconType="iInCircle"
              title={<h2>Loading types…</h2>}
              body={<p>Fetching resource types. This should only take a moment.</p>}
            />
          ) : typeOptions.length === 0 ? (
            <EuiEmptyPrompt
              iconType="alert"
              title={<h2>No types available</h2>}
              body={
                <p>
                  No resource types are available for sharing. Please ensure you’ve created
                  resources that support sharing.
                </p>
              }
            />
          ) : (
            <EuiEmptyPrompt
              iconType="iInCircle"
              title={<h2>Select a type to view resources</h2>}
              body={<p>Pick a resource type from the dropdown to load accessible resources.</p>}
            />
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
          noItemsMessage={
            !loading && (
              <EuiEmptyPrompt
                iconType="search"
                title={<h2>No resources found</h2>}
                body={<p>There are no accessible resources for the selected type.</p>}
              />
            )
          }
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
        accessLevels={currentAccessLevels}
      />
    </EuiPanel>
  );
};
