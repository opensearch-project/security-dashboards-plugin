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

import React from 'react';
import { ClusterPermissionPanel } from '../cluster-permission-panel';
import { RoleEdit } from '../role-edit';
import { ActionGroupItem } from '../../../types';
import { fetchActionGroups } from '../../../utils/action-groups-utils';

import { render, waitFor } from '@testing-library/react';

import { act } from 'react-dom/test-utils';
import { IndexPermissionPanel } from '../index-permission-panel';

jest.mock('../../../utils/role-detail-utils', () => ({
  getRoleDetail: jest.fn().mockReturnValue({
    cluster_permissions: [],
    index_permissions: [],
    tenant_permissions: [],
    reserved: false,
  }),
  updateRole: jest.fn(),
}));
jest.mock('../../../utils/action-groups-utils');

jest.mock('../cluster-permission-panel', () => ({
  ClusterPermissionPanel: jest.fn(() => null) as jest.Mock,
}));

jest.mock('../index-permission-panel', () => ({
  IndexPermissionPanel: jest.fn(() => null) as jest.Mock,
}));

describe('Role edit filtering', () => {
  const sampleSourceRole = 'role';
  const mockCoreStart = {
    http: 1,
  };

  it('basic cluster permission panel rendering', async () => {
    const action = 'create';
    const buildBreadcrumbs = jest.fn();

    (fetchActionGroups as jest.Mock).mockResolvedValue({
      data_access: {
        reserved: true,
        hidden: false,
        allowed_actions: ['indices:data/*', 'crud'],
        type: 'index',
        description: 'Allow all read/write operations on data',
        static: true,
      },
      cluster_manage_pipelines: {
        reserved: true,
        hidden: false,
        allowed_actions: ['cluster:admin/ingest/pipeline/*'],
        type: 'cluster',
        description: 'Manage pipelines',
        static: true,
      },
    });

    render(
      <RoleEdit
        action={action}
        sourceRoleName={sampleSourceRole}
        buildBreadcrumbs={buildBreadcrumbs}
        coreStart={mockCoreStart as any}
        navigation={{} as any}
        params={{} as any}
        config={{} as any}
      />
    );

    await act(async () => {
      await waitFor(() => {
        expect(ClusterPermissionPanel).toHaveBeenCalled();
      });
    });

    const lastCallArgs =
      ClusterPermissionPanel.mock.calls[ClusterPermissionPanel.mock.calls.length - 1];
    const [props] = lastCallArgs;

    // Cluster Permission Panel props is filtered to action groups with type cluster, and only the cluster permission constants
    expect(props.optionUniverse).toEqual([
      {
        label: 'Permission groups',
        options: [
          {
            label: 'cluster_manage_pipelines',
          },
        ],
      },
      {
        label: 'Cluster permissions',
        options: [
          {
            label: 'cluster:admin/component_template/delete',
          },
          {
            label: 'cluster:admin/component_template/get',
          },
          {
            label: 'cluster:admin/component_template/put',
          },
          {
            label: 'cluster:admin/decommission/awareness/delete',
          },
          {
            label: 'cluster:admin/decommission/awareness/get',
          },
          {
            label: 'cluster:admin/decommission/awareness/put',
          },
          {
            label: 'cluster:admin/indices/dangling/delete',
          },
          {
            label: 'cluster:admin/indices/dangling/find',
          },
          {
            label: 'cluster:admin/indices/dangling/import',
          },
          {
            label: 'cluster:admin/indices/dangling/list',
          },
          {
            label: 'cluster:admin/ingest/pipeline/delete',
          },
          {
            label: 'cluster:admin/ingest/pipeline/get',
          },
          {
            label: 'cluster:admin/ingest/pipeline/put',
          },
          {
            label: 'cluster:admin/ingest/pipeline/simulate',
          },
          {
            label: 'cluster:admin/ingest/processor/grok/get',
          },
          {
            label: 'cluster:admin/nodes/reload_secure_settings',
          },
          {
            label: 'cluster:admin/persistent/completion',
          },
          {
            label: 'cluster:admin/persistent/remove',
          },
          {
            label: 'cluster:admin/persistent/start',
          },
          {
            label: 'cluster:admin/persistent/update_status',
          },
          {
            label: 'cluster:admin/remotestore/restore',
          },
          {
            label: 'cluster:admin/opendistro/ad/detector/delete',
          },
          {
            label: 'cluster:admin/opendistro/ad/detector/info',
          },
          {
            label: 'cluster:admin/opendistro/ad/detector/jobmanagement',
          },
          {
            label: 'cluster:admin/opendistro/ad/detector/preview',
          },
          {
            label: 'cluster:admin/opendistro/ad/detector/run',
          },
          {
            label: 'cluster:admin/opendistro/ad/detector/search',
          },
          {
            label: 'cluster:admin/opendistro/ad/detector/stats',
          },
          {
            label: 'cluster:admin/opendistro/ad/detector/write',
          },
          {
            label: 'cluster:admin/opendistro/ad/detectors/get',
          },
          {
            label: 'cluster:admin/opendistro/ad/detector/validate',
          },
          {
            label: 'cluster:admin/opendistro/ad/result/search',
          },
          {
            label: 'cluster:admin/opendistro/ad/result/topAnomalies',
          },
          {
            label: 'cluster:admin/opendistro/ad/tasks/search',
          },
          {
            label: 'cluster:admin/opendistro/alerting/alerts/ack',
          },
          {
            label: 'cluster:admin/opendistro/alerting/alerts/get',
          },
          {
            label: 'cluster:admin/opendistro/alerting/destination/delete',
          },
          {
            label: 'cluster:admin/opendistro/alerting/destination/email_account/delete',
          },
          {
            label: 'cluster:admin/opendistro/alerting/destination/email_account/get',
          },
          {
            label: 'cluster:admin/opendistro/alerting/destination/email_account/search',
          },
          {
            label: 'cluster:admin/opendistro/alerting/destination/email_account/write',
          },
          {
            label: 'cluster:admin/opendistro/alerting/destination/email_group/delete',
          },
          {
            label: 'cluster:admin/opendistro/alerting/destination/email_group/get',
          },
          {
            label: 'cluster:admin/opendistro/alerting/destination/email_group/search',
          },
          {
            label: 'cluster:admin/opendistro/alerting/destination/email_group/write',
          },
          {
            label: 'cluster:admin/opendistro/alerting/destination/get',
          },
          {
            label: 'cluster:admin/opendistro/alerting/destination/write',
          },
          {
            label: 'cluster:admin/opendistro/alerting/monitor/delete',
          },
          {
            label: 'cluster:admin/opendistro/alerting/monitor/execute',
          },
          {
            label: 'cluster:admin/opendistro/alerting/monitor/get',
          },
          {
            label: 'cluster:admin/opendistro/alerting/monitor/search',
          },
          {
            label: 'cluster:admin/opendistro/alerting/monitor/write',
          },
          {
            label: 'cluster:admin/opendistro/ism/managedindex/add',
          },
          {
            label: 'cluster:admin/opendistro/ism/managedindex/change',
          },
          {
            label: 'cluster:admin/opendistro/ism/managedindex/remove',
          },
          {
            label: 'cluster:admin/opendistro/ism/managedindex/explain',
          },
          {
            label: 'cluster:admin/opendistro/ism/managedindex/retry',
          },
          {
            label: 'cluster:admin/opendistro/ism/policy/write',
          },
          {
            label: 'cluster:admin/opendistro/ism/policy/get',
          },
          {
            label: 'cluster:admin/opendistro/ism/policy/search',
          },
          {
            label: 'cluster:admin/opendistro/ism/policy/delete',
          },
          {
            label: 'cluster:admin/opensearch/controlcenter/lron/get',
          },
          {
            label: 'cluster:admin/opensearch/controlcenter/lron/delete',
          },
          {
            label: 'cluster:admin/opensearch/controlcenter/lron/write',
          },
          {
            label: 'cluster:admin/opensearch/notifications/channels/get',
          },
          {
            label: 'cluster:admin/opensearch/notifications/configs/create',
          },
          {
            label: 'cluster:admin/opensearch/notifications/configs/delete',
          },
          {
            label: 'cluster:admin/opensearch/notifications/configs/get',
          },
          {
            label: 'cluster:admin/opensearch/notifications/configs/update',
          },
          {
            label: 'cluster:admin/opensearch/notifications/features',
          },
          {
            label: 'cluster:admin/opensearch/notifications/feature/send',
          },
          {
            label: 'cluster:admin/opensearch/notifications/test_notification',
          },
          {
            label: 'cluster:admin/opendistro/rollup/index',
          },
          {
            label: 'cluster:admin/opendistro/rollup/get',
          },
          {
            label: 'cluster:admin/opendistro/rollup/search',
          },
          {
            label: 'cluster:admin/opendistro/rollup/delete',
          },
          {
            label: 'cluster:admin/opendistro/rollup/start',
          },
          {
            label: 'cluster:admin/opendistro/rollup/stop',
          },
          {
            label: 'cluster:admin/opendistro/rollup/explain',
          },
          {
            label: 'cluster:admin/opendistro/transform/delete',
          },
          {
            label: 'cluster:admin/opendistro/transform/explain',
          },
          {
            label: 'cluster:admin/opendistro/transform/get',
          },
          {
            label: 'cluster:admin/opendistro/transform/get_transforms',
          },
          {
            label: 'cluster:admin/opendistro/transform/index',
          },
          {
            label: 'cluster:admin/opendistro/transform/preview',
          },
          {
            label: 'cluster:admin/opendistro/transform/start',
          },
          {
            label: 'cluster:admin/opendistro/transform/stop',
          },
          {
            label: 'cluster:admin/opensearch/snapshot_management/policy/write',
          },
          {
            label: 'cluster:admin/opensearch/snapshot_management/policy/get',
          },
          {
            label: 'cluster:admin/opensearch/snapshot_management/policy/search',
          },
          {
            label: 'cluster:admin/opensearch/snapshot_management/policy/delete',
          },
          {
            label: 'cluster:admin/opensearch/snapshot_management/policy/explain',
          },
          {
            label: 'cluster:admin/opensearch/snapshot_management/policy/start',
          },
          {
            label: 'cluster:admin/opensearch/snapshot_management/policy/stop',
          },
          {
            label: 'cluster:admin/opendistro/reports/definition/create',
          },
          {
            label: 'cluster:admin/opendistro/reports/definition/update',
          },
          {
            label: 'cluster:admin/opendistro/reports/definition/on_demand',
          },
          {
            label: 'cluster:admin/opendistro/reports/definition/delete',
          },
          {
            label: 'cluster:admin/opendistro/reports/definition/get',
          },
          {
            label: 'cluster:admin/opendistro/reports/definition/list',
          },
          {
            label: 'cluster:admin/opendistro/reports/instance/list',
          },
          {
            label: 'cluster:admin/opendistro/reports/instance/get',
          },
          {
            label: 'cluster:admin/opendistro/reports/menu/download',
          },
          {
            label: 'cluster:admin/opensearch/ql/datasources/create',
          },
          {
            label: 'cluster:admin/opensearch/ql/datasources/read',
          },
          {
            label: 'cluster:admin/opensearch/ql/datasources/update',
          },
          {
            label: 'cluster:admin/opensearch/ql/datasources/delete',
          },
          {
            label: 'cluster:admin/opensearch/ppl',
          },
          {
            label: 'cluster:admin/opensearch/ml/create_model_meta',
          },
          {
            label: 'cluster:admin/opensearch/ml/execute',
          },
          {
            label: 'cluster:admin/opensearch/ml/load_model',
          },
          {
            label: 'cluster:admin/opensearch/ml/load_model_on_nodes',
          },
          {
            label: 'cluster:admin/opensearch/ml/models/delete',
          },
          {
            label: 'cluster:admin/opensearch/ml/models/get',
          },
          {
            label: 'cluster:admin/opensearch/ml/models/search',
          },
          {
            label: 'cluster:admin/opensearch/ml/predict',
          },
          {
            label: 'cluster:admin/opensearch/ml/profile/nodes',
          },
          {
            label: 'cluster:admin/opensearch/ml/stats/nodes',
          },
          {
            label: 'cluster:admin/opensearch/ml/tasks/delete',
          },
          {
            label: 'cluster:admin/opensearch/ml/tasks/get',
          },
          {
            label: 'cluster:admin/opensearch/ml/tasks/search',
          },
          {
            label: 'cluster:admin/opensearch/ml/train',
          },
          {
            label: 'cluster:admin/opensearch/ml/trainAndPredict',
          },
          {
            label: 'cluster:admin/opensearch/ml/unload_model',
          },
          {
            label: 'cluster:admin/opensearch/ml/upload_model',
          },
          {
            label: 'cluster:admin/opensearch/ml/upload_model_chunk',
          },
          {
            label: 'cluster:admin/opensearch/observability/create',
          },
          {
            label: 'cluster:admin/opensearch/observability/delete',
          },
          {
            label: 'cluster:admin/opensearch/observability/get',
          },
          {
            label: 'cluster:admin/opensearch/observability/update',
          },
          {
            label: 'cluster:admin/reindex/rethrottle',
          },
          {
            label: 'cluster:admin/repository/_cleanup',
          },
          {
            label: 'cluster:admin/repository/delete',
          },
          {
            label: 'cluster:admin/repository/get',
          },
          {
            label: 'cluster:admin/repository/put',
          },
          {
            label: 'cluster:admin/repository/verify',
          },
          {
            label: 'cluster:admin/reroute',
          },
          {
            label: 'cluster:admin/routing/awareness/weights/delete',
          },
          {
            label: 'cluster:admin/routing/awareness/weights/get',
          },
          {
            label: 'cluster:admin/routing/awareness/weights/put',
          },
          {
            label: 'cluster:admin/script/delete',
          },
          {
            label: 'cluster:admin/script/get',
          },
          {
            label: 'cluster:admin/script/put',
          },
          {
            label: 'cluster:admin/script_context/get',
          },
          {
            label: 'cluster:admin/script_language/get',
          },
          {
            label: 'cluster:admin/settings/update',
          },
          {
            label: 'cluster:admin/snapshot/create',
          },
          {
            label: 'cluster:admin/snapshot/clone',
          },
          {
            label: 'cluster:admin/snapshot/delete',
          },
          {
            label: 'cluster:admin/snapshot/get',
          },
          {
            label: 'cluster:admin/snapshot/restore',
          },
          {
            label: 'cluster:admin/snapshot/status',
          },
          {
            label: 'cluster:admin/snapshot/status*',
          },
          {
            label: 'cluster:admin/tasks/cancel',
          },
          {
            label: 'cluster:admin/tasks/test',
          },
          {
            label: 'cluster:admin/tasks/testunblock',
          },
          {
            label: 'cluster:admin/voting_config/add_exclusions',
          },
          {
            label: 'cluster:admin/voting_config/clear_exclusions',
          },
          {
            label: 'cluster:monitor/allocation/explain',
          },
          {
            label: 'cluster:monitor/health',
          },
          {
            label: 'cluster:monitor/main',
          },
          {
            label: 'cluster:monitor/nodes/hot_threads',
          },
          {
            label: 'cluster:monitor/nodes/info',
          },
          {
            label: 'cluster:monitor/nodes/liveness',
          },
          {
            label: 'cluster:monitor/nodes/stats',
          },
          {
            label: 'cluster:monitor/nodes/usage',
          },
          {
            label: 'cluster:monitor/remote/info',
          },
          {
            label: 'cluster:monitor/state',
          },
          {
            label: 'cluster:monitor/stats',
          },
          {
            label: 'cluster:monitor/task',
          },
          {
            label: 'cluster:monitor/task/get',
          },
          {
            label: 'cluster:monitor/tasks/list',
          },
          {
            label: 'cluster:monitor/tasks/list*',
          },
          {
            label: 'restapi:admin/actiongroups',
          },
          {
            label: 'restapi:admin/allowlist',
          },
          {
            label: 'restapi:admin/internalusers',
          },
          {
            label: 'restapi:admin/nodesdn',
          },
          {
            label: 'restapi:admin/roles',
          },
          {
            label: 'restapi:admin/rolesmapping',
          },
          {
            label: 'restapi:admin/ssl/certs/info',
          },
          {
            label: 'restapi:admin/ssl/certs/reload',
          },
          {
            label: 'restapi:admin/tenants',
          },
          {
            label: 'indices:admin/template/delete',
          },
          {
            label: 'indices:admin/template/get',
          },
          {
            label: 'indices:admin/template/put',
          },
          {
            label: 'indices:admin/index_template/delete',
          },
          {
            label: 'indices:admin/index_template/get',
          },
          {
            label: 'indices:admin/index_template/put',
          },
          {
            label: 'indices:admin/index_template/simulate',
          },
          {
            label: 'indices:admin/index_template/simulate_index',
          },
          {
            label: 'indices:data/read/scroll',
          },
          {
            label: 'indices:data/read/scroll/clear',
          },
          {
            label: 'indices:data/write/bulk',
          },
          {
            label: 'indices:data/write/bulk*',
          },
          {
            label: 'indices:data/read/mget',
          },
          {
            label: 'indices:data/read/mget*',
          },
          {
            label: 'indices:data/read/msearch',
          },
          {
            label: 'indices:data/read/msearch/template',
          },
          {
            label: 'indices:data/read/mtv',
          },
          {
            label: 'indices:data/read/mtv*',
          },
          {
            label: 'indices:data/write/reindex',
          },
        ],
      },
    ]);
  });

  it('basic index permission panel rendering', async () => {
    const action = 'create';
    const buildBreadcrumbs = jest.fn();

    (fetchActionGroups as jest.Mock).mockResolvedValue({
      data_access: {
        reserved: true,
        hidden: false,
        allowed_actions: ['indices:data/*', 'crud'],
        type: 'index',
        description: 'Allow all read/write operations on data',
        static: true,
      },
      cluster_manage_pipelines: {
        reserved: true,
        hidden: false,
        allowed_actions: ['cluster:admin/ingest/pipeline/*'],
        type: 'cluster',
        description: 'Manage pipelines',
        static: true,
      },
    });

    render(
      <RoleEdit
        action={action}
        sourceRoleName={sampleSourceRole}
        buildBreadcrumbs={buildBreadcrumbs}
        coreStart={mockCoreStart as any}
        navigation={{} as any}
        params={{} as any}
        config={{} as any}
      />
    );

    await act(async () => {
      await waitFor(() => {
        expect(IndexPermissionPanel).toHaveBeenCalled();
      });
    });

    const lastCallArgs =
      IndexPermissionPanel.mock.calls[IndexPermissionPanel.mock.calls.length - 1];
    const [props] = lastCallArgs;

    // Index Permission Panel props is filtered to action groups with type index, and only the index permission constants
    expect(props.optionUniverse).toEqual([
      {
        label: 'Permission groups',
        options: [
          {
            label: 'data_access',
          },
        ],
      },
      {
        label: 'Index permissions',
        options: [
          {
            label: 'indices:admin/aliases',
          },
          {
            label: 'indices:admin/aliases/exists',
          },
          {
            label: 'indices:admin/aliases/get',
          },
          {
            label: 'indices:admin/analyze',
          },
          {
            label: 'indices:admin/auto_create',
          },
          {
            label: 'indices:admin/block/add',
          },
          {
            label: 'indices:admin/cache/clear',
          },
          {
            label: 'indices:admin/close',
          },
          {
            label: 'indices:admin/close*',
          },
          {
            label: 'indices:admin/create',
          },
          {
            label: 'indices:admin/data_stream/create',
          },
          {
            label: 'indices:admin/data_stream/delete',
          },
          {
            label: 'indices:admin/data_stream/get',
          },
          {
            label: 'indices:admin/delete',
          },
          {
            label: 'indices:admin/exists',
          },
          {
            label: 'indices:admin/flush',
          },
          {
            label: 'indices:admin/flush*',
          },
          {
            label: 'indices:admin/forcemerge',
          },
          {
            label: 'indices:admin/get',
          },
          {
            label: 'indices:admin/mapping/auto_put',
          },
          {
            label: 'indices:admin/mapping/put',
          },
          {
            label: 'indices:admin/mappings/fields/get',
          },
          {
            label: 'indices:admin/mappings/fields/get*',
          },
          {
            label: 'indices:admin/mappings/get',
          },
          {
            label: 'indices:admin/open',
          },
          {
            label: 'indices:admin/refresh',
          },
          {
            label: 'indices:admin/refresh*',
          },
          {
            label: 'indices:admin/resize',
          },
          {
            label: 'indices:admin/resolve/index',
          },
          {
            label: 'indices:admin/rollover',
          },
          {
            label: 'indices:admin/seq_no/global_checkpoint_sync',
          },
          {
            label: 'indices:admin/seq_no/add_retention_lease',
          },
          {
            label: 'indices:admin/seq_no/remove_retention_lease',
          },
          {
            label: 'indices:admin/seq_no/renew_retention_lease',
          },
          {
            label: 'indices:admin/settings/update',
          },
          {
            label: 'indices:admin/shards/search_shards',
          },
          {
            label: 'indices:admin/shrink',
          },
          {
            label: 'indices:admin/synced_flush',
          },
          {
            label: 'indices:admin/types/exists',
          },
          {
            label: 'indices:admin/upgrade',
          },
          {
            label: 'indices:admin/validate/query',
          },
          {
            label: 'indices:data/read/explain',
          },
          {
            label: 'indices:data/read/field_caps',
          },
          {
            label: 'indices:data/read/field_caps*',
          },
          {
            label: 'indices:data/read/get',
          },
          {
            label: 'indices:data/read/point_in_time/create',
          },
          {
            label: 'indices:data/read/point_in_time/delete',
          },
          {
            label: 'indices:data/read/point_in_time/readall',
          },
          {
            label: 'indices:data/read/search',
          },
          {
            label: 'indices:data/read/search*',
          },
          {
            label: 'indices:data/read/search/template',
          },
          {
            label: 'indices:data/read/tv',
          },
          {
            label: 'indices:data/write/delete',
          },
          {
            label: 'indices:data/write/delete/byquery',
          },
          {
            label: 'indices:data/write/index',
          },
          {
            label: 'indices:data/write/update',
          },
          {
            label: 'indices:data/write/update/byquery',
          },
          {
            label: 'indices:monitor/data_stream/stats',
          },
          {
            label: 'indices:monitor/point_in_time/segments',
          },
          {
            label: 'indices:monitor/recovery',
          },
          {
            label: 'indices:monitor/segments',
          },
          {
            label: 'indices:monitor/settings/get',
          },
          {
            label: 'indices:monitor/shard_stores',
          },
          {
            label: 'indices:monitor/stats',
          },
          {
            label: 'indices:monitor/upgrade',
          },
        ],
      },
    ]);
  });
});
