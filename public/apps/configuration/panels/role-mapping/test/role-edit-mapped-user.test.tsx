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
jest.mock('react', () => ({
  ...jest.requireActual('react'),
  useContext: jest.fn().mockReturnValue({ dataSource: { id: 'test' }, setDataSource: jest.fn() }), // Mock the useContext hook to return dummy datasource and setdatasource function
}));
// eslint-disable-next-line
const roleMappingUtils = require('../../../utils/role-mapping-utils');

describe('Role mapping edit', () => {
  const setState = jest.fn();
  const sampleRole = 'role';
  const mockCoreStart = {
    http: 1,
  };

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
        coreStart={mockCoreStart as any}
        depsStart={{} as any}
        params={{} as any}
        config={{} as any}
      />
    );

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
        coreStart={mockCoreStart as any}
        depsStart={{} as any}
        params={{} as any}
        config={{} as any}
      />
    );
    process.nextTick(() => {
      expect(getRoleMappingData).toHaveBeenCalledTimes(1);
      expect(fetchUserNameList).toHaveBeenCalledTimes(1);
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
        coreStart={mockCoreStart as any}
        depsStart={{} as any}
        params={{} as any}
        config={{} as any}
      />
    );
    // click update
    component.find('#map').last().simulate('click');

    expect(updateRoleMapping).toHaveBeenCalledWith(
      mockCoreStart.http,
      sampleRole,
      {
        users: [],
        backend_roles: [],
        hosts: [],
      },
      'test'
    );
  });

  it('trims new users and backend roles and keeps stored ones unchanged on submit', async () => {
    const storedUser = 'AA BB ';
    const storedRole = 'cn=AA BB/CC (DD) my, company end=with=whitespace ';
    roleMappingUtils.getRoleMappingData = jest.fn().mockReturnValue({
      users: [storedUser, 'user1'],
      backend_roles: [storedRole, 'backend_role1'],
      hosts: [],
    });
    useState.mockImplementationOnce(() => [
      [
        { label: storedUser },
        { label: 'user1' },
        { label: ' user2 ' },
        { label: ' ' },
        { label: ' user1' },
      ],
      setState,
    ]);
    useState.mockImplementationOnce(() => [
      [
        { externalIdentity: storedRole },
        { externalIdentity: 'backend_role1' },
        { externalIdentity: '  backend_role2 ' },
        { externalIdentity: '   ' },
        { externalIdentity: 'backend_role1 ' },
      ],
      setState,
    ]);
    const component = shallow(
      <RoleEditMappedUser
        roleName={sampleRole}
        coreStart={mockCoreStart as any}
        depsStart={{} as any}
        params={{} as any}
        config={{} as any}
      />
    );
    // Keep the handler from the first render, which holds the mocked state; loading re-renders.
    const map = component.find('#map').last();
    await new Promise(process.nextTick);
    map.simulate('click');

    expect(updateRoleMapping).toHaveBeenLastCalledWith(
      mockCoreStart.http,
      sampleRole,
      {
        users: [storedUser, 'user1', 'user2'],
        backend_roles: [storedRole, 'backend_role1', 'backend_role2'],
        hosts: [],
      },
      'test'
    );
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
        coreStart={mockCoreStart as any}
        depsStart={{} as any}
        params={{} as any}
        config={{} as any}
      />
    );
    // click update
    component.find('#map').last().simulate('click');
    expect(consoleError).toHaveBeenCalledWith(error);
  });
});
