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

import { RoleList } from './role-list';
import { shallow } from 'enzyme';
import React from 'react';
import { EuiInMemoryTable } from '@elastic/eui';

jest.mock('../utils/role-list-utils');
jest.mock('../utils/url-builder');
jest.mock('../utils/display-utils');
// eslint-disable-next-line
const mockRoleListUtils = require('../utils/role-list-utils');

describe('Role list', () => {
  const setState = jest.fn();
  const mockCoreStart = {
    http: 1,
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
        navigation={{} as any}
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
        coreStart={{} as any}
        navigation={{} as any}
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
        navigation={{} as any}
        params={{} as any}
        config={{} as any}
      />
    );

    process.nextTick(() => {});
    process.nextTick(() => {
      expect(mockRoleListUtils.fetchRole).toHaveBeenCalledTimes(1);
      expect(mockRoleListUtils.fetchRoleMapping).toHaveBeenCalledTimes(1);
      expect(mockRoleListUtils.transformRoleData).toHaveBeenCalledTimes(1);
      expect(setState).toHaveBeenCalledWith(mockRoleListingData);
      done();
    });
  });
});
