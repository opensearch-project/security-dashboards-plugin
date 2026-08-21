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

import './resource-share-button.scss';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { EuiToolTip } from '@elastic/eui';

import type { CoreStart } from '../../../../../src/core/public';
import { buildResourceApi } from '../../utils/resource-sharing-utils';
import { ShareAccessModal } from './share-access-modal';
import { countSharedPrincipals, hasSharingInfo } from './share-utils';
import { PrivateLockIcon, ShareNodesIcon, SharedWithIcon } from './share-icons';
import { ResourceRow, TypeEntry } from './types';

/**
 * Public props for the embeddable share button. Consumer plugins provide only
 * the resource coordinates; everything else (API access, modal, permissions)
 * is handled internally.
 */
export interface ResourceShareButtonProps {
  /** ID of the resource to share, e.g. a detector id. */
  resourceId: string;
  /** Registered resource type, e.g. `anomaly-detector`. */
  resourceType: string;
  /**
   * Human-readable name of the resource (e.g. the detector name), shown in
   * the modal instead of the opaque resource id when provided.
   */
  resourceName?: string;
  /** Optional data source id when Multi Data Source is enabled. */
  dataSourceId?: string;
  /** Called after sharing info has been successfully created/updated. */
  onUpdated?: () => void;
  /** Button size, defaults to 's'. */
  size?: 's' | 'm';
  /** Render as filled button. Defaults to false. */
  fill?: boolean;
  /**
   * Whether to show the Private / Shared status pill above the action. Defaults
   * to true (list views); set false on single-resource detail pages where the
   * status is shown elsewhere and only the action button is wanted.
   */
  showStatus?: boolean;
  /**
   * Visual style of the trigger: 'button' (default) renders a labeled button,
   * 'icon' renders a compact icon-only button with a tooltip — suited for
   * dense placements like table rows.
   */
  display?: 'button' | 'icon';
  /**
   * Controlled mode: when set, the built-in trigger button is hidden and the
   * modal visibility follows this prop. Useful when the trigger lives inside
   * a context menu / popover that unmounts on close.
   */
  isModalOpen?: boolean;
  /** Controlled mode: called when the modal is dismissed (or cannot be shown). */
  onModalClose?: () => void;
}

export interface ResourceShareButtonInternalProps extends ResourceShareButtonProps {
  http: CoreStart['http'];
  notifications: CoreStart['notifications'];
}

interface RecordState {
  loading: boolean;
  /** undefined => not found / not accessible */
  record?: ResourceRow;
  accessLevels: string[];
  /** feature disabled or type unknown => hide button entirely */
  hidden: boolean;
  error?: string;
}

const INITIAL_STATE: RecordState = {
  loading: true,
  accessLevels: [],
  hidden: false,
};

/**
 * Short-lived request coalescing so many buttons rendered at once (e.g. one
 * per table row) share a single types/list fetch instead of N identical calls.
 */
const COALESCE_TTL_MS = 5000;
const inflightCache = new Map<string, { promise: Promise<any>; ts: number }>();

/** Test helper: clears the request-coalescing cache. */
export const resetShareButtonRequestCache = () => inflightCache.clear();

function coalesced<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const now = Date.now();
  const hit = inflightCache.get(key);
  if (hit && now - hit.ts < COALESCE_TTL_MS) {
    return hit.promise as Promise<T>;
  }
  const promise = fn().catch((e) => {
    // do not cache failures
    inflightCache.delete(key);
    throw e;
  });
  inflightCache.set(key, { promise, ts: now });
  return promise;
}

/**
 * Status pill. Rendered as a custom chip (not EuiBadge) because EuiBadge only
 * renders string/registered icon names and silently drops custom SVG
 * components — we need the prototype's padlock / person-with-plus glyphs.
 * Colors come from EUI theme variables via resource-share-button.scss so the
 * pill stays uniform with the page. Icons inherit `currentColor`.
 */
const StatusPill: React.FC<{ shared: boolean; count: number; resourceId: string }> = ({
  shared,
  count,
  resourceId,
}) => (
  <span
    className={`osdResourceShareStatus osdResourceShareStatus--${shared ? 'shared' : 'private'}`}
    data-test-subj={`resource-share-status-${resourceId}`}
  >
    {shared ? <SharedWithIcon /> : <PrivateLockIcon />}
    {shared ? 'Shared' : 'Private'}
  </span>
);

/**
 * Access-action button, structured per the prototype `.access-action` (compact
 * outlined button with a connected-nodes icon, or a disabled padlock variant
 * when the user lacks permission). Colors come from EUI theme variables via
 * resource-share-button.scss. `iconOnly` drops the label for dense rows.
 */
const ActionButton: React.FC<{
  label: string;
  disabled: boolean;
  loading: boolean;
  iconOnly: boolean;
  resourceId: string;
  onClick: () => void;
}> = ({ label, disabled, loading, iconOnly, resourceId, onClick }) => {
  const isBlocked = disabled || loading;
  const Icon = disabled && !loading ? PrivateLockIcon : ShareNodesIcon;
  return (
    <button
      type="button"
      className={`osdResourceShareAction${iconOnly ? ' osdResourceShareAction--iconOnly' : ''}`}
      disabled={isBlocked}
      aria-label={label}
      onClick={onClick}
      data-test-subj={`resource-share-button-${resourceId}`}
    >
      <Icon />
      {!iconOnly && <span>{label}</span>}
    </button>
  );
};

/**
 * Standalone share button + modal for a single protected resource.
 *
 * Fetches the sharing record and available access-levels on mount, renders a
 * Private / Shared status pill and a `Share` / `Manage access` action button,
 * and opens the shared access modal on click. Renders nothing when resource
 * sharing is disabled on the cluster or the resource type is not registered.
 */
export const ResourceShareButton: React.FC<ResourceShareButtonInternalProps> = (props) => {
  const {
    resourceId,
    resourceType,
    resourceName,
    dataSourceId,
    onUpdated,
    http,
    notifications,
    display = 'button',
    showStatus = true,
    isModalOpen: controlledModalOpen,
    onModalClose,
  } = props;

  const isControlled = controlledModalOpen !== undefined;

  const api = useMemo(() => buildResourceApi(http, dataSourceId), [http, dataSourceId]);
  const [state, setState] = useState<RecordState>(INITIAL_STATE);
  const [internalModalOpen, setInternalModalOpen] = useState(false);
  const isModalOpen = isControlled ? controlledModalOpen : internalModalOpen;
  const closeModal = () => {
    if (isControlled) onModalClose?.();
    else setInternalModalOpen(false);
  };

  const fetchRecord = useCallback(
    async (bypassCache: boolean = false) => {
      setState((s) => ({ ...s, loading: true, error: undefined }));
      try {
        const dsKey = dataSourceId ?? '';
        if (bypassCache) {
          inflightCache.delete(`types:${dsKey}`);
          inflightCache.delete(`list:${dsKey}:${resourceType}`);
        }
        // Fetch types (for access-level suggestions) and accessible records in parallel.
        // The list API is used because it is the only API returning `can_share` today.
        // Calls are coalesced across concurrently-mounted buttons (e.g. table rows).
        const [typesRes, listRes] = await Promise.all([
          coalesced(`types:${dsKey}`, () => api.listTypes()),
          coalesced(`list:${dsKey}:${resourceType}`, () => api.listSharingRecords(resourceType)),
        ]);

        const types: TypeEntry[] = Array.isArray(typesRes)
          ? typesRes
          : (typesRes as any)?.types || [];
        const typeEntry = types.find((t) => t.type === resourceType);
        if (!typeEntry) {
          // Type not registered as a shareable/protected resource => nothing to render.
          setState({ loading: false, accessLevels: [], hidden: true });
          return;
        }

        const rows: ResourceRow[] = Array.isArray(listRes)
          ? listRes
          : (listRes as any)?.resources || (listRes as any)?.body || [];
        const record = (Array.isArray(rows) ? rows : []).find((r) => r.resource_id === resourceId);

        setState({
          loading: false,
          record,
          accessLevels: Array.from(new Set(typeEntry.access_levels ?? [])).sort(),
          hidden: false,
        });
      } catch (e: any) {
        const status = e?.response?.status ?? e?.body?.statusCode;
        if (status === 501 || status === 400) {
          // 501: resource-sharing feature disabled; 400: type not protected.
          setState({ loading: false, accessLevels: [], hidden: true });
          return;
        }
        setState({
          loading: false,
          accessLevels: [],
          hidden: false,
          error: e?.body?.message || e?.message || 'Failed to load sharing info',
        });
      }
    },
    [api, dataSourceId, resourceId, resourceType]
  );

  useEffect(() => {
    fetchRecord();
  }, [fetchRecord]);

  // Controlled mode: open requested but sharing is not possible => notify and dismiss.
  useEffect(() => {
    if (!isControlled || !isModalOpen || state.loading || state.hidden) return;
    const rec = state.record;
    if (!rec || rec.can_share !== true || state.error) {
      notifications.toasts.addWarning(
        state.error
          ? `Unable to load sharing info: ${state.error}`
          : !rec
          ? 'Sharing information for this resource is not available.'
          : 'You do not have access to update sharing information of this resource'
      );
      onModalClose?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isControlled, isModalOpen, state]);

  const handleSubmitModal = async (payload: any) => {
    const isCreate = !hasSharingInfo(state.record?.share_with);
    if (isCreate) {
      await api.share(payload);
      notifications.toasts.addSuccess('Resource shared.');
    } else {
      await api.update(payload);
      notifications.toasts.addSuccess('Access updated.');
    }
    await fetchRecord(true);
    onUpdated?.();
  };

  if (state.hidden) {
    return null;
  }

  const record = state.record;
  const shared = hasSharingInfo(record?.share_with);
  const label = shared ? 'Manage access' : 'Share';
  const canShare = record?.can_share === true;

  const disabledReason = state.error
    ? `Unable to load sharing info: ${state.error}`
    : !record
    ? 'Sharing information for this resource is not available.'
    : !canShare
    ? 'You do not have access to update sharing information of this resource'
    : undefined;

  const trigger = (
    <ActionButton
      label={label}
      disabled={!!disabledReason}
      loading={state.loading}
      iconOnly={display === 'icon'}
      resourceId={resourceId}
      onClick={() => setInternalModalOpen(true)}
    />
  );

  const triggerTooltip =
    display === 'icon'
      ? disabledReason ?? label
      : disabledReason && !state.loading
      ? disabledReason
      : undefined;

  const sharedCount = shared ? countSharedPrincipals(record?.share_with) : 0;
  const statusPill = showStatus && !state.loading && record && (
    <StatusPill shared={shared} count={sharedCount} resourceId={resourceId} />
  );

  return (
    <>
      {!isControlled && (
        <div className="osdResourceShareStack">
          {statusPill}
          {triggerTooltip ? (
            <EuiToolTip content={triggerTooltip}>
              <span>{trigger}</span>
            </EuiToolTip>
          ) : (
            trigger
          )}
        </div>
      )}
      {isModalOpen && record && canShare && (
        <ShareAccessModal
          mode={shared ? 'edit' : 'create'}
          isOpen={true}
          onClose={closeModal}
          onSubmit={handleSubmitModal}
          resource={record}
          resourceName={resourceName}
          resourceType={resourceType}
          resourceTypeIndex={resourceType}
          accessLevels={state.accessLevels}
        />
      )}
    </>
  );
};
