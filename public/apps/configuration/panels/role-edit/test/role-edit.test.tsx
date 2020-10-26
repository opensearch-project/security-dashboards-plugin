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

import { EuiButton, EuiFieldText } from '@elastic/eui';
import { shallow } from 'enzyme';
import React from 'react';
import { updateRole } from '../../../utils/role-detail-utils';
import { setCrossPageToast } from '../../../utils/storage-utils';
import { fetchTenantNameList } from '../../../utils/tenant-utils';
import { ClusterPermissionPanel } from '../cluster-permission-panel';
import { IndexPermissionPanel } from '../index-permission-panel';
import { getSuccessToastMessage, RoleEdit } from '../role-edit';
import { TenantPanel } from '../tenant-panel';

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

describe('Role edit', () => {
  const sampleSourceRole = 'role';
  const mockCoreStart = {
    http: 1,
  };

  const useEffect = jest.spyOn(React, 'useEffect');
  const useState = jest.spyOn(React, 'useState');
  // useEffect.mockImplementationOnce((f) => f());

  it('basic rendering', () => {
    const action = 'create';
    const buildBreadcrumbs = jest.fn();

    const component = shallow(
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

    expect(buildBreadcrumbs).toBeCalledTimes(1);
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
    const buildBreadcrumbs = jest.fn();

    const component = shallow(
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
        navigation={{} as any}
        params={{} as any}
        config={{} as any}
      />
    );
    // click update
    component.find(EuiButton).last().simulate('click');

    expect(updateRole).toBeCalledWith(mockCoreStart.http, '', {
      cluster_permissions: [],
      index_permissions: [],
      tenant_permissions: [],
    });

    process.nextTick(() => {
      expect(setCrossPageToast).toHaveBeenCalled();
      done();
    });
  });
});
