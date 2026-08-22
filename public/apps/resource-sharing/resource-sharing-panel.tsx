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
  EuiFlexGroup,
  EuiFlexItem,
  EuiPanel,
  EuiText,
  EuiToolTip,
  EuiSuperSelect,
  EuiSuperSelectOption,
} from '@elastic/eui';

import _ from 'lodash';

import type { CoreStart } from '../../../../../src/core/public';

import { ResourceRow, ResourceSharingApi, ShareWith, TypeEntry } from './types';
import { hasSharingInfo, humanizeAccessLevel } from './share-utils';
import { ShareAccessModal } from './share-access-modal';

interface Props {
  api: ResourceSharingApi;
  toasts: CoreStart['notifications']['toasts'];
}
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
            <strong>Access level:</strong> {humanizeAccessLevel(level)}
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

  const selectedTypeMeta = useMemo(
    () => typeOptions.find((o) => o.value === selectedType),
    [typeOptions, selectedType]
  );
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
          <EuiText size="s" tabIndex={0}>
            {selectedTypeLabel}
          </EuiText>
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
        const label = hasSharingInfo(item.share_with) ? 'Manage access' : 'Share';
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
            <span tabIndex={0}>{btn}</span>
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
            aria-label="Select resource type"
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
          tableCaption="Shared resources"
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
