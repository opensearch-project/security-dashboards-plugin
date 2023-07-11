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
import { CLUSTER_PERMISSIONS, INDEX_PERMISSIONS } from '../../../constants';

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

  it('basic cluster permission panel rendering', async () => {
    const action = 'create';
    const buildBreadcrumbs = jest.fn();

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
        options: CLUSTER_PERMISSIONS.map((x) => {
          return { label: x };
        }),
      },
    ]);
  });

  it('basic index permission panel rendering', async () => {
    const action = 'create';
    const buildBreadcrumbs = jest.fn();

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
        options: INDEX_PERMISSIONS.map((x) => {
          return { label: x };
        }),
      },
    ]);
  });
});
