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

import { RoleList } from '../role-list';
import { mount, shallow } from 'enzyme';
import React from 'react';
import { EuiInMemoryTable, EuiTableFieldDataColumnType } from '@elastic/eui';
import { buildHashUrl } from '../../utils/url-builder';
import { Action } from '../../types';
import { ResourceType } from '../../../../../common';
import { RoleListing } from '../../utils/role-list-utils';
import { useDeleteConfirmState } from '../../utils/delete-confirm-modal-utils';
import { getDashboardsInfoSafe } from '../../../../utils/dashboards-info-utils';
import { act } from 'react-dom/test-utils';

jest.mock('../../utils/role-list-utils');
jest.mock('../../utils/context-menu', () => ({
  useContextMenuState: jest
    .fn()
    .mockImplementation((buttonText, buttonProps, children) => [children, jest.fn()]),
}));
jest.mock('../../utils/delete-confirm-modal-utils', () => ({
  useDeleteConfirmState: jest.fn().mockReturnValue([jest.fn(), '']),
}));
jest.mock('react', () => ({
  ...jest.requireActual('react'),
  useContext: jest.fn().mockReturnValue({ dataSource: { id: 'test' }, setDataSource: jest.fn() }), // Mock the useContext hook to return dummy datasource and setdatasource function
}));
jest.mock('../../../../utils/dashboards-info-utils');

// eslint-disable-next-line
const mockRoleListUtils = require('../../utils/role-list-utils');

describe('Role List based on MultiTenancy', () => {
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
  const mockDepsStart = { navigation: { ui: { HeaderControl: {} } } };

  const mockRoleListingData = [
    {
      roleName: 'role_1',
      reserved: true,
      clusterPermission: ['readonly'],
      indexPermission: ['data1'],
      tenantPermission: ['tenant1'],
      internaluser: [],
      backendRoles: [],
    },
  ];

  mockRoleListUtils.transformRoleData = jest.fn().mockReturnValue(mockRoleListingData);
  mockRoleListUtils.fetchRole = jest.fn().mockResolvedValue(mockRoleListingData);
  mockRoleListUtils.fetchRoleMapping = jest.fn().mockResolvedValue({});

  it('render Tenants column when multitenancy is enabled', async () => {
    const mockConfig = {
      multitenancy: {
        enabled: true,
      },
    };

    const mockDashboardsInfo = {
      multitenancy_enabled: true,
    };
    (getDashboardsInfoSafe as jest.Mock).mockResolvedValue(mockDashboardsInfo);

    let wrapper;
    await act(async () => {
      wrapper = mount(
        <RoleList
          coreStart={mockCoreStart}
          depsStart={mockDepsStart as any}
          params={{}}
          config={mockConfig}
        />
      );
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
    wrapper.update();
    const roleListtable = wrapper.find('EuiInMemoryTable');
    const columns = roleListtable.prop('columns');
    expect(columns.some((column: any) => column.name === 'Tenants')).toBeTruthy();
    const searchFilters = roleListtable.prop('search');
    expect(
      searchFilters.filters.some((searchFilter: any) => searchFilter.name === 'Tenants')
    ).toBeTruthy();
    expect(columns.some((column: any) => column.name === 'Tenants')).toBeTruthy();
  });

  it('does not render Tenants column when multitenancy is disabled in config', async () => {
    const mockConfig = {
      multitenancy: {
        enabled: false,
      },
    };

    const mockDashboardsInfo = {
      multitenancy_enabled: true,
    };
    (getDashboardsInfoSafe as jest.Mock).mockResolvedValue(mockDashboardsInfo);

    let wrapper;
    await act(async () => {
      wrapper = mount(
        <RoleList
          coreStart={mockCoreStart}
          depsStart={mockDepsStart as any}
          params={{}}
          config={mockConfig}
        />
      );
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
    wrapper.update();
    const roleListtable = wrapper.find('EuiInMemoryTable');
    const columns = roleListtable.prop('columns');
    expect(columns.some((column: any) => column.name === 'Tenants')).toBeFalsy();
    const searchFilters = roleListtable.prop('search');
    expect(
      searchFilters.filters.some((searchFilter: any) => searchFilter.name === 'Tenants')
    ).toBeFalsy();
    expect(columns.some((column: any) => column.name === 'Tenants')).toBeFalsy();
  });

  it('does not render Tenants column when multitenancy is disabled in dashboards info', async () => {
    const mockConfig = {
      multitenancy: {
        enabled: true,
      },
    };

    const mockDashboardsInfo = {
      multitenancy_enabled: false,
    };
    (getDashboardsInfoSafe as jest.Mock).mockResolvedValue(mockDashboardsInfo);

    let wrapper;
    await act(async () => {
      wrapper = mount(
        <RoleList
          coreStart={mockCoreStart}
          depsStart={mockDepsStart as any}
          params={{}}
          config={mockConfig}
        />
      );
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
    wrapper.update();
    const roleListtable = wrapper.find('EuiInMemoryTable');
    const columns = roleListtable.prop('columns');
    expect(columns.some((column: any) => column.name === 'Tenants')).toBeFalsy();
    const searchFilters = roleListtable.prop('search');
    expect(
      searchFilters.filters.some((searchFilter: any) => searchFilter.name === 'Tenants')
    ).toBeFalsy();
    expect(columns.some((column: any) => column.name === 'Tenants')).toBeFalsy();
  });

  it('does not render Tenants column when multitenancy is disabled in both config and dashboards info', async () => {
    const mockConfig = {
      multitenancy: {
        enabled: false,
      },
    };

    const mockDashboardsInfo = {
      multitenancy_enabled: false,
    };
    (getDashboardsInfoSafe as jest.Mock).mockResolvedValue(mockDashboardsInfo);

    let wrapper;
    await act(async () => {
      wrapper = mount(
        <RoleList
          coreStart={mockCoreStart}
          depsStart={mockDepsStart as any}
          params={{}}
          config={mockConfig}
        />
      );
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
    wrapper.update();
    const roleListtable = wrapper.find('EuiInMemoryTable');
    const columns = roleListtable.prop('columns');
    expect(columns.some((column: any) => column.name === 'Tenants')).toBeFalsy();
    const searchFilters = roleListtable.prop('search');
    expect(
      searchFilters.filters.some((searchFilter: any) => searchFilter.name === 'Tenants')
    ).toBeFalsy();
    expect(columns.some((column: any) => column.name === 'Tenants')).toBeFalsy();
  });

  it('should handle error when fetching dashboards info', async () => {
    (getDashboardsInfoSafe as jest.Mock).mockRejectedValue(new Error());

    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementationOnce(() => {});

    let wrapper;
    await act(async () => {
      wrapper = mount(
        <RoleList
          coreStart={mockCoreStart}
          depsStart={mockDepsStart as any}
          params={{}}
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

describe('Role list', () => {
  const setState = jest.fn();
  const mockCoreStart = {
    http: 1,
    uiSettings: {
      get: jest.fn().mockReturnValue(false),
    },
  };

  beforeEach(() => {
    jest.spyOn(React, 'useState').mockImplementation((initialValue) => [initialValue, setState]);
  });

  it('Render empty', () => {
    const mockRoleListingData = [
      {
        roleName: 'role_1',
        reserved: true,
        clusterPermission: ['readonly'],
        indexPermission: ['data1'],
        tenantPermission: ['tenant1'],
        internaluser: [],
        backendRoles: [],
      },
    ];

    mockRoleListUtils.transformRoleData = jest.fn().mockReturnValue(mockRoleListingData);

    const component = shallow(
      <RoleList
        coreStart={mockCoreStart as any}
        depsStart={{ navigation: {} }}
        params={{} as any}
        config={{} as any}
      />
    );

    expect(component.find(EuiInMemoryTable).prop('items').length).toBe(0);
  });

  it('Render error', (done) => {
    jest.spyOn(React, 'useEffect').mockImplementationOnce((f) => f());
    // Hide the error message
    jest.spyOn(console, 'log').mockImplementationOnce(() => {});
    mockRoleListUtils.fetchRole.mockImplementationOnce(() => {
      throw Error();
    });

    shallow(
      <RoleList
        coreStart={mockCoreStart as any}
        depsStart={{ navigation: {} }}
        params={{} as any}
        config={{} as any}
      />
    );

    process.nextTick(() => {
      // Expect setting error to true
      expect(setState).toHaveBeenCalledWith(true);
      done();
    });
  });

  it('Render data', (done) => {
    jest.spyOn(React, 'useEffect').mockImplementationOnce((f) => f());

    const mockRoleListingData = [
      {
        roleName: 'role_1',
        reserved: true,
        clusterPermission: ['readonly'],
        indexPermission: ['data1'],
        tenantPermission: ['tenant1'],
        internaluser: [],
        backendRoles: [],
      },
    ];

    mockRoleListUtils.transformRoleData = jest.fn().mockReturnValue(mockRoleListingData);

    shallow(
      <RoleList
        coreStart={mockCoreStart as any}
        depsStart={{ navigation: {} }}
        params={{} as any}
        config={{} as any}
      />
    );

    process.nextTick(() => {
      expect(mockRoleListUtils.fetchRole).toHaveBeenCalledTimes(1);
      expect(mockRoleListUtils.fetchRoleMapping).toHaveBeenCalledTimes(1);
      expect(mockRoleListUtils.transformRoleData).toHaveBeenCalledTimes(1);
      expect(setState).toHaveBeenCalledWith(mockRoleListingData);
      done();
    });
  });

  it('delete role', (done) => {
    shallow(
      <RoleList
        coreStart={mockCoreStart as any}
        depsStart={{ navigation: {} }}
        params={{} as any}
        config={{} as any}
      />
    );
    const deleteFunc = useDeleteConfirmState.mock.calls[0][0];

    deleteFunc();

    process.nextTick(() => {
      expect(mockRoleListUtils.requestDeleteRoles).toBeCalled();
      done();
    });
  });

  it('error occurred while deleting the role', () => {
    (mockRoleListUtils.requestDeleteRoles as jest.Mock).mockImplementationOnce(() => {
      throw new Error();
    });
    const spy = jest.spyOn(console, 'log').mockImplementationOnce(() => {});
    shallow(
      <RoleList
        coreStart={mockCoreStart as any}
        depsStart={{ navigation: {} }}
        params={{} as any}
        config={{} as any}
      />
    );
    const deleteFunc = useDeleteConfirmState.mock.calls[0][0];

    deleteFunc();
    expect(spy).toBeCalled();
  });

  describe('Action menu click', () => {
    let component;
    const mockRoleListingData: RoleListing = {
      roleName: 'role_1',
      reserved: true,
      clusterPermissions: ['readonly'],
      indexPermissions: ['data1'],
      tenantPermissions: ['tenant1'],
      internalUsers: [],
      backendRoles: [],
    };
    beforeEach(() => {
      jest.spyOn(React, 'useState').mockRestore();
      jest
        .spyOn(React, 'useState')
        .mockImplementationOnce(() => [[mockRoleListingData], jest.fn()])
        .mockImplementationOnce(() => [false, jest.fn()])
        .mockImplementationOnce(() => [[mockRoleListingData], jest.fn()])
        .mockImplementationOnce(() => [false, jest.fn()]);
      component = shallow(
        <RoleList
          coreStart={mockCoreStart as any}
          depsStart={{ navigation: {} }}
          params={{} as any}
          config={{} as any}
        />
      );
    });

    it('Edit click', () => {
      component.find('[data-test-subj="edit"]').simulate('click');
      expect(window.location.hash).toBe(
        buildHashUrl(ResourceType.roles, Action.edit, mockRoleListingData.roleName)
      );
    });

    it('Duplicate click', () => {
      component.find('[data-test-subj="duplicate"]').simulate('click');
      expect(window.location.hash).toBe(
        buildHashUrl(ResourceType.roles, Action.duplicate, mockRoleListingData.roleName)
      );
    });
  });

  describe('Render columns', () => {
    beforeEach(() => {
      jest.spyOn(React, 'useState').mockRestore();
      jest
        .spyOn(React, 'useState')
        .mockImplementationOnce(() => [[], jest.fn()])
        .mockImplementationOnce(() => [false, jest.fn()])
        .mockImplementationOnce(() => [[], jest.fn()])
        .mockImplementationOnce(() => [false, jest.fn()]);
    });
    it('render role name column', () => {
      const wrapper = shallow(
        <RoleList
          coreStart={mockCoreStart as any}
          depsStart={{ navigation: {} }}
          params={{} as any}
          config={{} as any}
        />
      );
      const roleList = wrapper.find('[data-test-subj="role-list"]');
      const component = mount(<>{roleList}</>);
      const columns = component.prop<Array<EuiTableFieldDataColumnType<RoleListing>>>('columns');

      const roleNameRenderer = columns[0].render as (roleName: string) => JSX.Element;
      const Container = (props: { roleName: string }) => roleNameRenderer(props.roleName);
      const result = shallow(<Container roleName={'role1'} />);
      expect(result).toMatchSnapshot();
    });

    it('render Customization column', () => {
      const wrapper = shallow(
        <RoleList
          coreStart={mockCoreStart as any}
          depsStart={{ navigation: {} }}
          params={{} as any}
          config={{} as any}
        />
      );
      const roleList = wrapper.find('[data-test-subj="role-list"]');
      const component = mount(<>{roleList}</>);
      const columns = component.prop<Array<EuiTableFieldDataColumnType<RoleListing>>>('columns');

      const customizationRenderer = columns[6].render as (reserved: boolean) => JSX.Element;
      const Container = (props: { reserved: boolean }) => customizationRenderer(props.reserved);
      const result = shallow(<Container reserved={true} />);
      expect(result).toMatchSnapshot();
    });
  });

  describe('AccessError component', () => {
    let component;
    beforeEach(() => {
      jest.spyOn(React, 'useState').mockRestore();
      jest
        .spyOn(React, 'useState')
        .mockImplementationOnce(() => [[], jest.fn()])
        .mockImplementationOnce(() => [false, jest.fn()])
        .mockImplementationOnce(() => [[], jest.fn()])
        .mockImplementationOnce(() => [false, jest.fn()])
        .mockImplementationOnce(() => [true, jest.fn()]);
      component = shallow(
        <RoleList
          coreStart={mockCoreStart as any}
          depsStart={{ navigation: {} }}
          params={{} as any}
          config={{} as any}
        />
      );
    });

    it('should load access error component', () => {
      expect(component).toMatchSnapshot();
    });
  });
});
