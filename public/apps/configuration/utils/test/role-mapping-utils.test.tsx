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

import { UserType, transformRoleMappingData } from '../role-mapping-utils';

describe('Role mapping utils', () => {
  describe('transform role-mapping data', () => {
    const externalIdentities = ['externalIdentity1', 'externalIdentity2'];
    const internalUsers = ['user1', 'user2'];

    const roleMapping1 = {
      and_backend_roles: [],
      backend_roles: [],
      hidden: false,
      hosts: [],
      reserved: false,
      users: [],
    };

    const roleMapping2 = {
      and_backend_roles: [],
      backend_roles: externalIdentities,
      hidden: false,
      hosts: [],
      reserved: false,
      users: [],
    };

    const expectedMappedUsersListing2 = [
      {
        userName: externalIdentities[0],
        userType: UserType.external,
      },
      {
        userName: externalIdentities[1],
        userType: UserType.external,
      },
    ];

    const roleMapping3 = {
      and_backend_roles: [],
      backend_roles: [],
      hidden: false,
      hosts: [],
      reserved: false,
      users: internalUsers,
    };

    const expectedMappedUsersListing3 = [
      {
        userName: internalUsers[0],
        userType: UserType.internal,
      },
      {
        userName: internalUsers[1],
        userType: UserType.internal,
      },
    ];

    const roleMapping4 = {
      and_backend_roles: [],
      backend_roles: externalIdentities,
      hidden: false,
      hosts: [],
      reserved: false,
      users: internalUsers,
    };

    const expectedMappedUsersListing4 = [
      {
        userName: internalUsers[0],
        userType: UserType.internal,
      },
      {
        userName: internalUsers[1],
        userType: UserType.internal,
      },
      {
        userName: externalIdentities[0],
        userType: UserType.external,
      },
      {
        userName: externalIdentities[1],
        userType: UserType.external,
      },
    ];

    it('neither external identities nor internal users mapped to role', () => {
      const result = transformRoleMappingData(roleMapping1);
      expect(result).toEqual([]);
    });

    it('only external identities mapped to role', () => {
      const result = transformRoleMappingData(roleMapping2);
      expect(result).toEqual(expectedMappedUsersListing2);
    });

    it('only internal users mapped to role', () => {
      const result = transformRoleMappingData(roleMapping3);
      expect(result).toEqual(expectedMappedUsersListing3);
    });

    it('both external identities and internal users mapped to role', () => {
      const result = transformRoleMappingData(roleMapping4);
      expect(result).toEqual(expectedMappedUsersListing4);
    });
  });
});
