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

import { shallow } from 'enzyme';
import React from 'react';
import { fetchUserNameList } from '../../../utils/internal-user-list-utils';
import { getRoleMappingData, updateRoleMapping } from '../../../utils/role-mapping-utils';
import { ExternalIdentitiesPanel } from '../external-identities-panel';
import { InternalUsersPanel } from '../users-panel';
import { RoleEditMappedUser } from '../role-edit-mapped-user';
import { RoleMappingDetail } from '../../../types';

jest.mock('../../../utils/role-mapping-utils');
jest.mock('../../../utils/internal-user-list-utils', () => ({
  fetchUserNameList: jest.fn().mockReturnValue([]),
}));
// eslint-disable-next-line
const roleMappingUtils = require('../../../utils/role-mapping-utils');

describe('Role mapping edit', () => {
  const setState = jest.fn();
  const sampleRole = 'role';
  const mockCoreStart = {
    http: 1,
  };
  const buildBreadcrumbs = jest.fn();

  const useEffect = jest.spyOn(React, 'useEffect');
  const useState = jest.spyOn(React, 'useState');

  beforeEach(() => {
    useEffect.mockImplementationOnce((f) => f());
    useEffect.mockImplementationOnce((f) => f());
    useState.mockImplementation((initialValue) => [initialValue, setState]);
  });

  it('basic rendering', () => {
    const component = shallow(
      <RoleEditMappedUser
        roleName={sampleRole}
        buildBreadcrumbs={buildBreadcrumbs}
        coreStart={mockCoreStart as any}
        navigation={{} as any}
        params={{} as any}
        config={{} as any}
      />
    );

    expect(buildBreadcrumbs).toBeCalledTimes(1);
    expect(component.find(InternalUsersPanel).length).toBe(1);
    expect(component.find(ExternalIdentitiesPanel).length).toBe(1);
  });

  it('pull role-user mapping for editing', (done) => {
    const mockRoleMappingDetails: RoleMappingDetail = {
      backend_roles: ['externalIdentity1'],
      hosts: [],
      users: ['user1'],
    };

    roleMappingUtils.getRoleMappingData = jest.fn().mockReturnValue(mockRoleMappingDetails);

    shallow(
      <RoleEditMappedUser
        roleName={sampleRole}
        buildBreadcrumbs={buildBreadcrumbs}
        coreStart={mockCoreStart as any}
        navigation={{} as any}
        params={{} as any}
        config={{} as any}
      />
    );
    process.nextTick(() => {
      expect(getRoleMappingData).toBeCalledTimes(1);
      expect(fetchUserNameList).toBeCalledTimes(1);
      expect(setState).toHaveBeenCalledWith([{ label: 'user1' }]);
      expect(setState).toHaveBeenCalledWith([{ externalIdentity: 'externalIdentity1' }]);
      expect(setState).toHaveBeenCalledWith([]);
      done();
    });
  });

  it('submit update', () => {
    const component = shallow(
      <RoleEditMappedUser
        roleName={sampleRole}
        buildBreadcrumbs={buildBreadcrumbs}
        coreStart={mockCoreStart as any}
        navigation={{} as any}
        params={{} as any}
        config={{} as any}
      />
    );
    // click update
    component.find('#map').last().simulate('click');

    expect(updateRoleMapping).toBeCalledWith(mockCoreStart.http, sampleRole, {
      users: [],
      backend_roles: [],
      hosts: [],
    });
  });

  it('submit update error', () => {
    const consoleError = jest.spyOn(console, 'error');
    consoleError.mockImplementation(() => {});
    const error = new Error();
    roleMappingUtils.updateRoleMapping.mockImplementationOnce(() => {
      throw error;
    });

    const component = shallow(
      <RoleEditMappedUser
        roleName={sampleRole}
        buildBreadcrumbs={buildBreadcrumbs}
        coreStart={mockCoreStart as any}
        navigation={{} as any}
        params={{} as any}
        config={{} as any}
      />
    );
    // click update
    component.find('#map').last().simulate('click');
    expect(consoleError).toBeCalledWith(error);
  });
});
