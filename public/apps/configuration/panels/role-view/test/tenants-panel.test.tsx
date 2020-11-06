/*
 *   Copyright 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
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
import { mount, shallow } from 'enzyme';
import { TenantsPanel } from '../tenants-panel';
import { EuiEmptyPrompt, EuiInMemoryTable, EuiTableFieldDataColumnType } from '@elastic/eui';
import { buildHashUrl } from '../../../utils/url-builder';
import { Action, ResourceType, RoleTenantPermissionDetail } from '../../../types';
import { RoleViewTenantInvalidText } from '../../../constants';

jest.mock('../../../utils/tenant-utils');
jest.mock('../../../../../utils/auth-info-utils');
// eslint-disable-next-line
const mockTenantUtils = require('../../../utils/tenant-utils');
// eslint-disable-next-line
const mockAuthInfoUtils = require('../../../../../utils/auth-info-utils');

describe('Role view - tenant panel', () => {
  const setState = jest.fn();
  const mockCoreStart = {
    http: 1,
  };
  beforeEach(() => {
    jest.spyOn(React, 'useState').mockImplementation((initialValue) => [initialValue, setState]);
  });

  describe('Tenant permission list', () => {
    const sampleRoleName = 'role1';
    it('render empty', () => {
      const wrapper = shallow(
        <TenantsPanel
          roleName={sampleRoleName}
          tenantPermissions={[]}
          errorFlag={false}
          coreStart={mockCoreStart as any}
          loading={false}
          isReserved={false}
        />
      );

      expect(wrapper.find(EuiInMemoryTable).prop('items').length).toBe(0);
    });

    it('it renders a empty prompt when tenantPermissions is empty', () => {
      const wrapper = mount(
        <TenantsPanel
          roleName={sampleRoleName}
          tenantPermissions={[]}
          errorFlag={false}
          coreStart={mockCoreStart as any}
          loading={false}
          isReserved={false}
        />
      );

      const prompt = wrapper
        .find('[data-test-subj="tenant-permission-container"] tbody EuiEmptyPrompt')
        .first()
        .getElement();
      expect(prompt.type).toBe(EuiEmptyPrompt);
    });

    it('Add tenant permission button is disabled for reserved role', () => {
      const wrapper = mount(
        <TenantsPanel
          roleName={sampleRoleName}
          tenantPermissions={[]}
          errorFlag={false}
          coreStart={mockCoreStart as any}
          loading={false}
          isReserved={true}
        />
      );

      const prompt = wrapper
        .find('[data-test-subj="tenant-permission-container"] tbody EuiEmptyPrompt')
        .first()
        .getElement();
      const component = shallow(prompt);
      const button = component.find('[data-test-subj="addTenantPermission"]');
      expect(button.prop('disabled')).toBe(true);
    });

    it('should render to role edit page when click on Add tenant permission button', () => {
      const wrapper = mount(
        <TenantsPanel
          roleName={sampleRoleName}
          tenantPermissions={[]}
          errorFlag={false}
          coreStart={mockCoreStart as any}
          loading={false}
          isReserved={true}
        />
      );

      const prompt = wrapper
        .find('[data-test-subj="tenant-permission-container"] tbody EuiEmptyPrompt')
        .first()
        .getElement();
      const component = shallow(prompt);
      component.find('[data-test-subj="addTenantPermission"]').simulate('click');
      expect(window.location.hash).toBe(
        buildHashUrl(ResourceType.roles, Action.edit, sampleRoleName)
      );
    });

    it('click on View Dashboard link', () => {
      const tenantPermissions = [{ tenant_patterns: ['tenant1'], permissionType: 'dummy' }];
      const wrapper = mount(
        <TenantsPanel
          roleName={sampleRoleName}
          tenantPermissions={tenantPermissions}
          errorFlag={false}
          coreStart={mockCoreStart as any}
          loading={false}
          isReserved={true}
        />
      );

      const prompt = wrapper
        .find('[data-test-subj="tenant-permission-container"]')
        .first()
        .getElement();
      const component = shallow(prompt);
      const columns = component.prop<
        Array<EuiTableFieldDataColumnType<RoleTenantPermissionDetail>>
      >('columns');
      const viewDashboardRenderer = columns[3].render as (tenant: string) => JSX.Element;
      const Container = (props: { tenant: string }) => viewDashboardRenderer(props.tenant);
      const result = shallow(<Container tenant={'tenant1'} />);
      result.find('[data-test-subj="view-dashboard"]').simulate('click');
      expect(mockTenantUtils.selectTenant).toHaveBeenCalled();
    });

    it('click on View Visualizations link', () => {
      const tenantPermissions = [{ tenant_patterns: ['tenant1'], permissionType: 'dummy' }];
      const wrapper = mount(
        <TenantsPanel
          roleName={sampleRoleName}
          tenantPermissions={tenantPermissions}
          errorFlag={false}
          coreStart={mockCoreStart as any}
          loading={false}
          isReserved={true}
        />
      );

      const prompt = wrapper
        .find('[data-test-subj="tenant-permission-container"]')
        .first()
        .getElement();
      const component = shallow(prompt);
      const columns = component.prop<
        Array<EuiTableFieldDataColumnType<RoleTenantPermissionDetail>>
      >('columns');
      const viewVisualizationRenderer = columns[4].render as (tenant: string) => JSX.Element;
      const Container = (props: { tenant: string }) => viewVisualizationRenderer(props.tenant);
      const result = shallow(<Container tenant={'tenant1'} />);
      result.find('[data-test-subj="view-visualizations"]').simulate('click');
      expect(mockTenantUtils.selectTenant).toHaveBeenCalled();
    });

    it('render view dashboard column when tenant permissions contains multiple tenants or tenant pattern', () => {
      const tenantPermissions = [{ tenant_patterns: ['*'], permissionType: 'dummy' }];
      const wrapper = mount(
        <TenantsPanel
          roleName={sampleRoleName}
          tenantPermissions={tenantPermissions}
          errorFlag={false}
          coreStart={mockCoreStart as any}
          loading={false}
          isReserved={true}
        />
      );

      const prompt = wrapper
        .find('[data-test-subj="tenant-permission-container"]')
        .first()
        .getElement();
      const component = shallow(prompt);
      const columns = component.prop<
        Array<EuiTableFieldDataColumnType<RoleTenantPermissionDetail>>
      >('columns');
      const viewDashboardRenderer = columns[3].render as (tenant: string) => JSX.Element;
      const Container = (props: { tenant: string }) => viewDashboardRenderer(props.tenant);
      const result = shallow(<Container tenant={RoleViewTenantInvalidText} />);
      expect(result).toMatchSnapshot();
    });

    it('render view visualization column when tenant permissions contains multiple tenants or tenant pattern', () => {
      const tenantPermissions = [{ tenant_patterns: ['*'], permissionType: 'dummy' }];
      const wrapper = mount(
        <TenantsPanel
          roleName={sampleRoleName}
          tenantPermissions={tenantPermissions}
          errorFlag={false}
          coreStart={mockCoreStart as any}
          loading={false}
          isReserved={true}
        />
      );

      const prompt = wrapper
        .find('[data-test-subj="tenant-permission-container"]')
        .first()
        .getElement();
      const component = shallow(prompt);
      const columns = component.prop<
        Array<EuiTableFieldDataColumnType<RoleTenantPermissionDetail>>
      >('columns');
      const viewVisualizationRenderer = columns[4].render as (tenant: string) => JSX.Element;
      const Container = (props: { tenant: string }) => viewVisualizationRenderer(props.tenant);
      const result = shallow(<Container tenant={RoleViewTenantInvalidText} />);
      expect(result).toMatchSnapshot();
    });

    it('fetch data error', (done) => {
      jest.spyOn(React, 'useEffect').mockImplementationOnce((f) => f());
      // Hide the error message
      jest.spyOn(console, 'log').mockImplementationOnce(() => {});
      mockTenantUtils.fetchTenants.mockImplementationOnce(() => {
        throw Error();
      });

      shallow(
        <TenantsPanel
          roleName={sampleRoleName}
          tenantPermissions={[]}
          errorFlag={false}
          coreStart={mockCoreStart as any}
          loading={false}
          isReserved={false}
        />
      );

      process.nextTick(() => {
        // Expect setting error to true
        expect(setState).toHaveBeenCalledWith(true);
        done();
      });
    });

    it('fetch data', (done) => {
      jest.spyOn(React, 'useEffect').mockImplementationOnce((f) => f());

      const mockTenantPermissionData = [
        {
          tenant_patterns: ['tenant_1'],
          permissionType: 'read only',
          tenant: 'tenant_1',
          reserved: false,
          description: '',
          tenantValue: 'tenant_1',
        },
      ];

      mockTenantUtils.transformRoleTenantPermissionData = jest
        .fn()
        .mockReturnValue(mockTenantPermissionData);

      shallow(
        <TenantsPanel
          roleName={sampleRoleName}
          tenantPermissions={[]}
          errorFlag={false}
          coreStart={mockCoreStart as any}
          loading={false}
          isReserved={false}
        />
      );

      process.nextTick(() => {
        expect(mockTenantUtils.fetchTenants).toHaveBeenCalledTimes(1);
        expect(mockTenantUtils.transformTenantData).toHaveBeenCalledTimes(1);
        expect(mockTenantUtils.transformRoleTenantPermissionData).toHaveBeenCalledTimes(1);
        expect(mockAuthInfoUtils.getCurrentUser).toHaveBeenCalledTimes(1);
        expect(setState).toHaveBeenCalledWith(mockTenantPermissionData);
        done();
      });
    });
  });
});
