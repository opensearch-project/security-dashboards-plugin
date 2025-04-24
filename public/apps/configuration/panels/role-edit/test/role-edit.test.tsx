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

import { EuiSmallButton } from '@elastic/eui';
import { mount, shallow } from 'enzyme';
import React from 'react';
import { updateRole } from '../../../utils/role-detail-utils';
import { setCrossPageToast } from '../../../utils/storage-utils';
import { fetchTenantNameList } from '../../../utils/tenant-utils';
import { ClusterPermissionPanel } from '../cluster-permission-panel';
import { IndexPermissionPanel } from '../index-permission-panel';
import { RoleEdit } from '../role-edit';
import { TenantPanel } from '../tenant-panel';
import { getDashboardsInfoSafe } from '../../../../../utils/dashboards-info-utils';
import { act } from 'react-dom/test-utils';

jest.mock('../../../utils/role-detail-utils', () => ({
  getRoleDetail: jest.fn().mockReturnValue({
    cluster_permissions: [],
    index_permissions: [],
    tenant_permissions: [],
    reserved: false,
  }),
  updateRole: jest.fn(),
}));
jest.mock('../../../utils/action-groups-utils', () => ({
  fetchActionGroups: jest.fn().mockReturnValue({}),
}));
jest.mock('../../../utils/tenant-utils');
jest.mock('../../../utils/storage-utils');
jest.mock('react', () => ({
  ...jest.requireActual('react'),
  useContext: jest.fn().mockReturnValue({ dataSource: { id: 'test' }, setDataSource: jest.fn() }), // Mock the useContext hook to return dummy datasource and setdatasource function
}));
jest.mock('../../../../../utils/dashboards-info-utils');

const sampleSourceRole = 'role';
const mockCoreStart = {
  http: 1,
  uiSettings: {
    get: jest.fn().mockReturnValue(false),
  },
  chrome: {
    navGroup: { getNavGroupEnabled: jest.fn().mockReturnValue(false) },
    setBreadcrumbs: jest.fn(),
  },
};

describe('Role edit', () => {
  const useEffect = jest.spyOn(React, 'useEffect');
  const useState = jest.spyOn(React, 'useState');
  // useEffect.mockImplementationOnce((f) => f());

  it('basic rendering', () => {
    const action = 'create';

    const component = shallow(
      <RoleEdit
        action={action}
        sourceRoleName={sampleSourceRole}
        coreStart={mockCoreStart as any}
        depsStart={{} as any}
        params={{} as any}
        config={{} as any}
      />
    );

    expect(component.find(ClusterPermissionPanel).length).toBe(1);
    expect(component.find(IndexPermissionPanel).length).toBe(1);
    expect(component.find(TenantPanel).length).toBe(1);
  });

  it('pull role data for editing', () => {
    useEffect.mockImplementationOnce((f) => f());
    useEffect.mockImplementationOnce((f) => f());
    useEffect.mockImplementationOnce((f) => f());
    useState.mockImplementation((initialValue) => [initialValue, jest.fn()]);
    const action = 'edit';

    const component = shallow(
      <RoleEdit
        action={action}
        sourceRoleName={sampleSourceRole}
        coreStart={mockCoreStart as any}
        depsStart={{} as any}
        params={{} as any}
        config={{} as any}
      />
    );

    expect(fetchTenantNameList).toBeCalledTimes(1);
  });

  it('submit update', (done) => {
    useEffect.mockImplementationOnce((f) => f());
    useEffect.mockImplementationOnce((f) => f());
    useEffect.mockImplementationOnce((f) => f());
    useState.mockImplementation((initialValue) => [initialValue, jest.fn()]);
    const action = 'edit';
    const buildBreadcrumbs = jest.fn();

    const component = shallow(
      <RoleEdit
        action={action}
        sourceRoleName={sampleSourceRole}
        buildBreadcrumbs={buildBreadcrumbs}
        coreStart={mockCoreStart as any}
        depsStart={{} as any}
        params={{} as any}
        config={{} as any}
      />
    );
    // click update
    component.find(EuiSmallButton).last().simulate('click');

    expect(updateRole).toBeCalledWith(
      mockCoreStart.http,
      '',
      {
        cluster_permissions: [],
        index_permissions: [],
        tenant_permissions: [],
      },
      'test'
    );

    process.nextTick(() => {
      expect(setCrossPageToast).toHaveBeenCalled();
      done();
    });
  });
});

describe('Role Create/Edit base on Multitenancy', () => {
  const mockDepsStart = { navigation: { ui: { HeaderControl: {} } } };
  const actions = ['create', 'edit'] as const;
  describe.each(actions)('when action is %s', (action) => {
    const testScenarios = [
      {
        description: 'When multitenancy is disabled in config and enabled in dashboards',
        configEnabled: false,
        dashboardsEnabled: true,
        shouldRenderTenantPanel: false,
      },
      {
        description: 'When multitenancy is disabled in both config and dashboards',
        configEnabled: false,
        dashboardsEnabled: false,
        shouldRenderTenantPanel: false,
      },
      {
        description: 'When multitenancy is enabled in config and disabled in dashboards',
        configEnabled: true,
        dashboardsEnabled: false,
        shouldRenderTenantPanel: false,
      },
      {
        description: 'When multitenancy is enabled in both config and dashboards',
        configEnabled: true,
        dashboardsEnabled: true,
        shouldRenderTenantPanel: true,
      },
    ] as const;

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it.each(testScenarios)(
      '$description → should render TenantPanel: $shouldRenderTenantPanel',
      async function ({ configEnabled, dashboardsEnabled, shouldRenderTenantPanel }) {
        const mockConfig = { multitenancy: { enabled: configEnabled } };
        const mockDashboardsInfo = { multitenancy_enabled: dashboardsEnabled };
        (getDashboardsInfoSafe as jest.Mock).mockResolvedValue(mockDashboardsInfo);

        let wrapper;
        await act(async () => {
          wrapper = mount(
            <RoleEdit
              action={action}
              sourceRoleName={sampleSourceRole}
              coreStart={mockCoreStart as any}
              depsStart={mockDepsStart as any}
              params={{} as any}
              config={mockConfig as any}
            />
          );
          await new Promise((resolve) => setTimeout(resolve, 0));
        });
        wrapper.update();
        expect(wrapper.find(TenantPanel).exists()).toBe(shouldRenderTenantPanel);
      }
    );

    it('should handle error when fetching dashboards info', async () => {
      (getDashboardsInfoSafe as jest.Mock).mockRejectedValue(new Error());

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementationOnce(() => {});

      let wrapper;
      await act(async () => {
        wrapper = mount(
          <RoleEdit
            action={action}
            sourceRoleName={sampleSourceRole}
            coreStart={mockCoreStart as any}
            depsStart={mockDepsStart as any}
            params={{} as any}
            config={{} as any}
          />
        );
        await new Promise((resolve) => setTimeout(resolve, 0));
      });
      wrapper.update();
      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });
  });
});
