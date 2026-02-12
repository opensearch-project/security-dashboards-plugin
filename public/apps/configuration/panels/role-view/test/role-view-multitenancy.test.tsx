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
import { act } from 'react-dom/test-utils';
import { mount } from 'enzyme';
import { RoleView } from '../role-view';
import { TenantsPanel } from '../tenants-panel';
import { TenantPermissionType } from '../../../types';
import { transformRoleIndexPermissions } from '../../../utils/index-permission-utils';
import { transformRoleTenantPermissions } from '../../../utils/tenant-utils';
import { getDashboardsInfoSafe } from '../../../../../utils/dashboards-info-utils';

jest.mock('../../../utils/role-mapping-utils', () => ({
  getRoleMappingData: jest.fn().mockResolvedValue({ backend_roles: [], hosts: [], users: [] }),
  transformRoleMappingData: jest.fn().mockReturnValue({ userName: '', userType: '' }),
  updateRoleMapping: jest.fn(),
}));
jest.mock('../../../utils/action-groups-utils', () => ({
  fetchActionGroups: jest.fn().mockResolvedValue({}),
}));
jest.mock('../../../utils/role-detail-utils', () => ({
  getRoleDetail: jest.fn().mockResolvedValue({
    cluster_permissions: [],
    index_permissions: [],
    tenant_permissions: [],
    reserved: false,
  }),
}));
jest.mock('../../../utils/delete-confirm-modal-utils', () => ({
  useDeleteConfirmState: jest.fn().mockReturnValue([jest.fn(), '']),
}));
jest.mock('../../../utils/index-permission-utils');
jest.mock('../../../utils/tenant-utils', () => ({
  transformRoleTenantPermissions: jest.fn(),
  fetchTenants: jest.fn().mockResolvedValue({}),
  transformRoleTenantPermissionData: jest.fn().mockReturnValue([]),
  transformTenantData: jest.fn().mockReturnValue({}),
}));
jest.mock('../../../../../utils/auth-info-utils', () => ({
  getCurrentUser: jest.fn().mockResolvedValue('test-user'),
}));
jest.mock('../../../utils/role-list-utils', () => ({
  requestDeleteRoles: jest.fn(),
}));
jest.mock('../../../utils/context-menu', () => ({
  useContextMenuState: jest
    .fn()
    .mockImplementation((buttonText, buttonProps, children) => [children, jest.fn()]),
}));
jest.mock('../../../utils/toast-utils', () => ({
  createErrorToast: jest.fn(),
  createUnknownErrorToast: jest.fn(),
  useToastState: jest.fn().mockReturnValue([[], jest.fn(), jest.fn()]),
}));
jest.mock('../../../../../utils/dashboards-info-utils');

// Mock useContext to provide DataSourceContext
jest.mock('react', () => ({
  ...jest.requireActual('react'),
  useContext: jest.fn().mockReturnValue({ dataSource: { id: 'test' }, setDataSource: jest.fn() }),
}));

const sampleRole = 'role';
const mockCoreStart = {
  http: 1,
  uiSettings: { get: jest.fn().mockReturnValue(false) },
  chrome: {
    navGroup: { getNavGroupEnabled: jest.fn().mockReturnValue(false) },
    setBreadcrumbs: jest.fn(),
  },
};
const mockDepsStart = { navigation: { ui: { HeaderControl: {} } } };

describe('RoleView multitenancy', () => {
  const mockRoleIndexPermission = [
    { index_patterns: ['*'], dls: '', fls: [], masked_fields: [], allowed_actions: [] },
  ];
  const mockRoleTenantPermission = {
    tenant_patterns: ['dummy'],
    permissionType: TenantPermissionType.Read,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (transformRoleIndexPermissions as jest.Mock).mockReturnValue(mockRoleIndexPermission);
    (transformRoleTenantPermissions as jest.Mock).mockReturnValue([mockRoleTenantPermission]);
  });

  afterEach(() => {
    // Ensure mock is reset for each test
    (transformRoleTenantPermissions as jest.Mock).mockReturnValue([mockRoleTenantPermission]);
  });

  it.each([
    { configEnabled: true, dashboardsEnabled: true, expected: true },
    { configEnabled: false, dashboardsEnabled: true, expected: false },
    { configEnabled: false, dashboardsEnabled: false, expected: false },
    { configEnabled: true, dashboardsEnabled: false, expected: false },
  ])(
    'config=$configEnabled, dashboards=$dashboardsEnabled → TenantsPanel=$expected',
    async ({ configEnabled, dashboardsEnabled, expected }) => {
      (getDashboardsInfoSafe as jest.Mock).mockResolvedValue({
        multitenancy_enabled: dashboardsEnabled,
      });

      let wrapper: any;
      await act(async () => {
        wrapper = mount(
          <RoleView
            roleName={sampleRole}
            prevAction=""
            coreStart={mockCoreStart as any}
            depsStart={mockDepsStart as any}
            params={{} as any}
            config={{ multitenancy: { enabled: configEnabled } } as any}
          />
        );
        await new Promise((r) => setTimeout(r, 50));
      });

      wrapper.update();
      expect(wrapper.find(TenantsPanel).exists()).toBe(expected);
    }
  );

  it('handles error when fetching dashboards info', async () => {
    (getDashboardsInfoSafe as jest.Mock).mockRejectedValue(new Error('test'));
    (transformRoleTenantPermissions as jest.Mock).mockReturnValue([mockRoleTenantPermission]);
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    let wrapper: any;
    await act(async () => {
      wrapper = mount(
        <RoleView
          roleName={sampleRole}
          prevAction=""
          coreStart={mockCoreStart as any}
          depsStart={mockDepsStart as any}
          params={{} as any}
          config={{ multitenancy: { enabled: true } } as any}
        />
      );
      await new Promise((r) => setTimeout(r, 50));
    });

    wrapper.update();
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});
