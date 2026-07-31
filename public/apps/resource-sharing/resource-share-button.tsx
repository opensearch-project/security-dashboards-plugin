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

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { EuiButton, EuiButtonIcon, EuiToolTip } from '@elastic/eui';

import type { CoreStart } from '../../../../../src/core/public';
import { buildResourceApi } from '../../utils/resource-sharing-utils';
import { ShareAccessModal } from './share-access-modal';
import { hasSharingInfo } from './share-utils';
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
  /** Optional data source id when Multi Data Source is enabled. */
  dataSourceId?: string;
  /** Called after sharing info has been successfully created/updated. */
  onUpdated?: () => void;
  /** Button size, defaults to 's'. */
  size?: 's' | 'm';
  /** Render as filled button. Defaults to false. */
  fill?: boolean;
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
 * Standalone share button + modal for a single protected resource.
 *
 * Fetches the sharing record and available access-levels on mount, renders a
 * `Share` / `Update Access` button and opens the shared access modal on click.
 * Renders nothing when resource-sharing is disabled on the cluster or the
 * resource type is not registered/protected.
 */
export const ResourceShareButton: React.FC<ResourceShareButtonInternalProps> = (props) => {
  const {
    resourceId,
    resourceType,
    dataSourceId,
    onUpdated,
    http,
    notifications,
    size = 's',
    fill = false,
    display = 'button',
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
  const label = shared ? 'Update Access' : 'Share';
  const canShare = record?.can_share === true;

  const disabledReason = state.error
    ? `Unable to load sharing info: ${state.error}`
    : !record
    ? 'Sharing information for this resource is not available.'
    : !canShare
    ? 'You do not have access to update sharing information of this resource'
    : undefined;

  // Controlled mode with share unavailable is handled by the effect above.
  const trigger =
    display === 'icon' ? (
      <EuiButtonIcon
        iconType="share"
        aria-label={label}
        isDisabled={state.loading || !!disabledReason}
        onClick={() => setInternalModalOpen(true)}
        data-test-subj={`resource-share-button-${resourceId}`}
      />
    ) : (
      <EuiButton
        size={size}
        fill={fill}
        iconType="share"
        isLoading={state.loading}
        isDisabled={state.loading || !!disabledReason}
        onClick={() => setInternalModalOpen(true)}
        data-test-subj={`resource-share-button-${resourceId}`}
      >
        {label}
      </EuiButton>
    );

  const triggerTooltip =
    display === 'icon'
      ? disabledReason ?? label
      : disabledReason && !state.loading
      ? disabledReason
      : undefined;

  return (
    <>
      {!isControlled &&
        (triggerTooltip ? (
          <EuiToolTip content={triggerTooltip}>
            <span>{trigger}</span>
          </EuiToolTip>
        ) : (
          trigger
        ))}
      {isModalOpen && record && canShare && (
        <ShareAccessModal
          mode={shared ? 'edit' : 'create'}
          isOpen={true}
          onClose={closeModal}
          onSubmit={handleSubmitModal}
          resource={record}
          resourceType={resourceType}
          resourceTypeIndex={resourceType}
          accessLevels={state.accessLevels}
        />
      )}
    </>
  );
};
