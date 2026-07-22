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
import { EuiButton, EuiToolTip } from '@elastic/eui';

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
  } = props;

  const api = useMemo(() => buildResourceApi(http, dataSourceId), [http, dataSourceId]);
  const [state, setState] = useState<RecordState>(INITIAL_STATE);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchRecord = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: undefined }));
    try {
      // Fetch types (for access-level suggestions) and accessible records in parallel.
      // The list API is used because it is the only API returning `can_share` today.
      const [typesRes, listRes] = await Promise.all([
        api.listTypes(),
        api.listSharingRecords(resourceType),
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
  }, [api, resourceId, resourceType]);

  useEffect(() => {
    fetchRecord();
  }, [fetchRecord]);

  const handleSubmitModal = async (payload: any) => {
    const isCreate = !hasSharingInfo(state.record?.share_with);
    if (isCreate) {
      await api.share(payload);
      notifications.toasts.addSuccess('Resource shared.');
    } else {
      await api.update(payload);
      notifications.toasts.addSuccess('Access updated.');
    }
    await fetchRecord();
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

  const button = (
    <EuiButton
      size={size}
      fill={fill}
      iconType="share"
      isLoading={state.loading}
      isDisabled={state.loading || !!disabledReason}
      onClick={() => setIsModalOpen(true)}
      data-test-subj={`resource-share-button-${resourceId}`}
    >
      {label}
    </EuiButton>
  );

  return (
    <>
      {disabledReason && !state.loading ? (
        <EuiToolTip content={disabledReason}>
          <span>{button}</span>
        </EuiToolTip>
      ) : (
        button
      )}
      {isModalOpen && record && (
        <ShareAccessModal
          mode={shared ? 'edit' : 'create'}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
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
