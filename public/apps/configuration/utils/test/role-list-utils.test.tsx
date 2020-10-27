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

import { transformRoleData, buildSearchFilterOptions } from '../role-list-utils';

describe('Role list utils', () => {
  describe('transform to listing data', () => {
    const clusterPermissions = ['cluster1', 'cluster2'];
    const indexPermissions = ['index1', 'index2', 'index3'];
    const tenantPermissions = ['tenant1', 'tenant2', 'tenant3'];
    const backendRoles = ['backendRole1', 'backendRole2'];
    const internalUsers = ['user1', 'user2'];
    const dummyArray = ['dummy'];

    const sampleRole1 = {
      reserved: true,
      cluster_permissions: clusterPermissions,
      index_permissions: [
        {
          index_patterns: [indexPermissions[0], indexPermissions[1]],
          fls: dummyArray,
          masked_fields: dummyArray,
          allowed_actions: dummyArray,
        },
        {
          index_patterns: [indexPermissions[2]],
          fls: dummyArray,
          masked_fields: dummyArray,
          allowed_actions: dummyArray,
        },
      ],
      tenant_permissions: [
        {
          tenant_patterns: [tenantPermissions[0]],
          allowed_actions: dummyArray,
        },
        {
          tenant_patterns: [tenantPermissions[1], tenantPermissions[2]],
          allowed_actions: dummyArray,
        },
      ],
    };
    const expectedRoleListing1 = {
      reserved: true,
      clusterPermissions,
      indexPermissions,
      tenantPermissions,
    };

    const sampleRole2 = {
      reserved: false,
      cluster_permissions: dummyArray,
      index_permissions: [],
      tenant_permissions: [],
    };
    const expectedRoleListing2 = {
      reserved: false,
      clusterPermissions: dummyArray,
      indexPermissions: [],
      tenantPermissions: [],
    };

    const sampleRoleMapping1 = {
      reserved: false,
      backend_roles: backendRoles,
      users: internalUsers,
    };
    const expectedRoleListingMapping1 = {
      backendRoles,
      internalUsers,
    };

    const expectedRoleListingEmptyMapping = {
      backendRoles: [],
      internalUsers: [],
    };

    it('one role and one mapping to the role', () => {
      const rawRoleData = {
        data: {
          role1: sampleRole1,
        },
      };
      const rawRoleMappingData = {
        data: {
          role1: sampleRoleMapping1,
        },
      };

      const result = transformRoleData(rawRoleData, rawRoleMappingData);

      expect(result.length).toBe(1);
      expect(result[0].roleName).toBe('role1');
      expect(result[0]).toMatchObject(expectedRoleListing1);
      expect(result[0]).toMatchObject(expectedRoleListingMapping1);
    });

    it('handle role without mapping', () => {
      const rawRoleData = {
        data: {
          role1: sampleRole1,
        },
      };
      const rawRoleMappingData = {
        data: {},
      };

      const result = transformRoleData(rawRoleData, rawRoleMappingData);

      expect(result.length).toBe(1);
      expect(result[0].roleName).toBe('role1');
      expect(result[0]).toMatchObject(expectedRoleListing1);
      expect(result[0]).toMatchObject(expectedRoleListingEmptyMapping);
    });

    it('ignore dangling role mapping', () => {
      const rawRoleData = {
        data: {},
      };
      const rawRoleMappingData = {
        data: {
          role1: sampleRoleMapping1,
        },
      };

      const result = transformRoleData(rawRoleData, rawRoleMappingData);

      expect(result.length).toBe(0);
    });

    it('more than 1 role', () => {
      const rawRoleData = {
        data: {
          role1: sampleRole1,
          role2: sampleRole2,
        },
      };
      const rawRoleMappingData = {
        data: {
          role1: sampleRoleMapping1,
        },
      };

      const result = transformRoleData(rawRoleData, rawRoleMappingData);

      expect(result.length).toBe(2);
      expect(result[0].roleName).toBe('role1');
      expect(result[0]).toMatchObject(expectedRoleListing1);
      expect(result[0]).toMatchObject(expectedRoleListingMapping1);
      expect(result[1].roleName).toBe('role2');
      expect(result[1]).toMatchObject(expectedRoleListing2);
      expect(result[1]).toMatchObject(expectedRoleListingEmptyMapping);
    });
  });

  describe('build search filter options', () => {
    it('', () => {
      const sampleUser1 = 'user1';
      const sampleUser2 = 'user2';
      const sampleUser3 = 'user3';
      const roleListing = [
        {
          internalUsers: [sampleUser3, sampleUser2],
        },
        {
          internalUsers: [''],
        },
        {
          internalUsers: [sampleUser3, sampleUser1],
        },
      ];

      const result = buildSearchFilterOptions(roleListing, 'internalUsers');

      /* The result should:
      1. contain no empty value
      2. be unique
      3. be sorted 
      */

      expect(result).toStrictEqual([
        { value: sampleUser1 },
        { value: sampleUser2 },
        { value: sampleUser3 },
      ]);
    });
  });
});
