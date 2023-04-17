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

import {
  GLOBAL_USER_DICT,
  PRIVATE_USER_DICT,
  transformTenantData,
  resolveTenantName,
  RESOLVED_GLOBAL_TENANT,
  RESOLVED_PRIVATE_TENANT,
  formatTenantName,
  transformRoleTenantPermissionData,
  getTenantPermissionType,
  transformRoleTenantPermissions,
  getNamespacesToRegister,
} from '../tenant-utils';
import {
  RoleViewTenantInvalidText,
  TENANT_READ_PERMISSION,
  TENANT_WRITE_PERMISSION,
} from '../../constants';
import { TenantPermissionType } from '../../types';
import { globalTenantName } from '../../../../../common';

describe('Tenant list utils', () => {
  const expectedGlobalTenantListing = {
    tenant: GLOBAL_USER_DICT.Label,
    reserved: true,
    description: GLOBAL_USER_DICT.Description,
    tenantValue: GLOBAL_USER_DICT.Value,
  };

  const expectedPrivateTenantListing = {
    tenant: PRIVATE_USER_DICT.Label,
    reserved: true,
    description: PRIVATE_USER_DICT.Description,
    tenantValue: PRIVATE_USER_DICT.Value,
  };

  const expectedTenantListing = {
    tenant: 'dummy',
    reserved: false,
    description: 'dummy',
    tenantValue: 'dummy',
  };

  const tenantList = [
    expectedGlobalTenantListing,
    expectedPrivateTenantListing,
    expectedTenantListing,
  ];

  describe('transform to listing data', () => {
    const globalTenant = {
      description: 'Global tenant',
      reserved: true,
      hidden: false,
      static: false,
      tenant: '',
      tenantValue: '',
    };

    const sampleTenant1 = {
      description: 'dummy',
      reserved: false,
      hidden: false,
      static: false,
      tenant: '',
      tenantValue: '',
    };

    it('transform global tenant', () => {
      const result = transformTenantData({ global_tenant: globalTenant });
      expect(result.length).toBe(2);
      expect(result[0]).toEqual(expectedGlobalTenantListing);
    });

    it('transform private tenant', () => {
      const result = transformTenantData({});
      expect(result.length).toBe(1);
      expect(result[0]).toEqual(expectedPrivateTenantListing);
    });

    it('transform global and custom tenant', () => {
      const result = transformTenantData({ global_tenant: globalTenant, dummy: sampleTenant1 });
      expect(result.length).toBe(3);
      expect(result[0]).toEqual(expectedGlobalTenantListing);
      expect(result[1]).toMatchObject(expectedPrivateTenantListing);
      expect(result[2]).toMatchObject(expectedTenantListing);
    });

    it('transform global, private and custom tenant', () => {
      const result = transformTenantData(
        { global_tenant: globalTenant, dummy: sampleTenant1 },
        true
      );
      expect(result.length).toBe(3);
      expect(result[0]).toEqual(expectedGlobalTenantListing);
      expect(result[1]).toEqual(expectedPrivateTenantListing);
      expect(result[2]).toMatchObject(expectedTenantListing);
    });
  });

  describe('Resolve tenant name', () => {
    const tenantNames = ['', 'undefined', 'user1', '__user__', ' dummy'];
    const userName = 'user1';

    it('resolve to global tenant when tenant name is empty', () => {
      const result = resolveTenantName(tenantNames[0], userName);
      expect(result).toBe(RESOLVED_GLOBAL_TENANT);
    });

    it('resolve to global tenant when tenant name is undefined', () => {
      const result = resolveTenantName(tenantNames[1], userName);
      expect(result).toBe(RESOLVED_GLOBAL_TENANT);
    });

    it('resolve to private tenant when tenant name is user name', () => {
      const result = resolveTenantName(tenantNames[2], userName);
      expect(result).toBe(RESOLVED_PRIVATE_TENANT);
    });

    it('resolve to private tenant when tenant name is __user__', () => {
      const result = resolveTenantName(tenantNames[3], userName);
      expect(result).toBe(RESOLVED_PRIVATE_TENANT);
    });

    it('resolve to actual tenant name when tenant name is custom', () => {
      const result = resolveTenantName(tenantNames[4], userName);
      expect(result).toBe(tenantNames[4]);
    });
  });

  describe('Format tenant name', () => {
    it('format global tenant', () => {
      const result = formatTenantName(globalTenantName);
      expect(result).toBe(GLOBAL_USER_DICT.Label);
    });

    it('format non-global tenant', () => {
      const result = formatTenantName('dummy');
      expect(result).toBe('dummy');
    });
  });

  const sampleTenantPattern1 = ['dummy'];
  const sampleTenantPattern2 = ['dummy', 'dummy'];
  const sampleTenantPattern3 = ['dummy*'];

  describe('transform role tenant permission data', () => {
    const permissionType = 'dummy';

    const expectedRoleTenantPermissionData1 = {
      tenant_patterns: sampleTenantPattern1,
      permissionType,
      tenant: tenantList[2].tenant,
      reserved: tenantList[2].reserved,
      description: tenantList[2].description,
      tenantValue: tenantList[2].tenantValue,
    };

    const expectedRoleTenantPermissionData2 = {
      tenant_patterns: sampleTenantPattern2,
      permissionType,
      tenant: RoleViewTenantInvalidText,
      reserved: false,
      description: RoleViewTenantInvalidText,
      tenantValue: RoleViewTenantInvalidText,
    };

    const expectedRoleTenantPermissionData3 = {
      tenant_patterns: sampleTenantPattern3,
      permissionType,
      tenant: RoleViewTenantInvalidText,
      reserved: false,
      description: RoleViewTenantInvalidText,
      tenantValue: RoleViewTenantInvalidText,
    };

    it('transform single tenant permission', () => {
      const result = transformRoleTenantPermissionData(
        [
          {
            tenant_patterns: sampleTenantPattern1,
            permissionType,
          },
        ],
        tenantList
      );
      expect(result[0]).toEqual(expectedRoleTenantPermissionData1);
    });

    it('transform multiple tenant permission', () => {
      const result = transformRoleTenantPermissionData(
        [
          {
            tenant_patterns: sampleTenantPattern2,
            permissionType,
          },
        ],
        tenantList
      );
      expect(result[0]).toEqual(expectedRoleTenantPermissionData2);
    });

    it('transform tenant pattern', () => {
      const result = transformRoleTenantPermissionData(
        [
          {
            tenant_patterns: sampleTenantPattern3,
            permissionType,
          },
        ],
        tenantList
      );
      expect(result[0]).toEqual(expectedRoleTenantPermissionData3);
    });
  });

  const emptyTenantPermissions: string[] = [];
  const readTenantPermissions: string[] = [TENANT_READ_PERMISSION];
  const readWriteTenantPermissions: string[] = [TENANT_WRITE_PERMISSION];

  describe('Tenant permission type', () => {
    it('empty permission', () => {
      const result = getTenantPermissionType(emptyTenantPermissions);
      expect(result).toBe(TenantPermissionType.None);
    });

    it('read permission', () => {
      const result = getTenantPermissionType(readTenantPermissions);
      expect(result).toBe(TenantPermissionType.Read);
    });

    it('write permission', () => {
      const result = getTenantPermissionType(readWriteTenantPermissions);
      expect(result).toBe(TenantPermissionType.ReadWrite);
    });
  });

  describe('transform role tenant permissions', () => {
    it('transform tenant patterns with just read permission', () => {
      const expectedRoleTenantPermissionView = {
        tenant_patterns: ['dummy'],
        permissionType: TenantPermissionType.Read,
      };

      const result = transformRoleTenantPermissions([
        {
          tenant_patterns: sampleTenantPattern1,
          allowed_actions: readTenantPermissions,
        },
      ]);
      expect(result[0]).toMatchObject(expectedRoleTenantPermissionView);
    });

    it('transform tenant patterns with read and write permission', () => {
      const expectedRoleTenantPermissionView = {
        tenant_patterns: ['dummy'],
        permissionType: TenantPermissionType.ReadWrite,
      };

      const result = transformRoleTenantPermissions([
        {
          tenant_patterns: sampleTenantPattern1,
          allowed_actions: readWriteTenantPermissions,
        },
      ]);
      expect(result[0]).toMatchObject(expectedRoleTenantPermissionView);
    });
  });

  describe('get list of namespaces to register', () => {
    it('resolves to list of namespaces with a custom tenant', () => {
      const authInfo = {
        user_name: 'user1',
        tenants: {
          global_tenant: true,
          user1_tenant: true,
          user1: true,
        },
      };
      const expectedNamespaces = [
        {
          id: GLOBAL_USER_DICT.Value,
          name: GLOBAL_USER_DICT.Label,
        },
        {
          id: 'user1_tenant',
          name: 'user1_tenant',
        },
        {
          id: `${PRIVATE_USER_DICT.Value}user1`,
          name: PRIVATE_USER_DICT.Label,
        },
        {
          id: 'default',
          name: 'default',
        },
      ];
      const result = getNamespacesToRegister(authInfo);
      expect(result).toMatchObject(expectedNamespaces);
    });

    it('resolves to list of namespaces without a custom tenant', () => {
      const authInfo = {
        user_name: 'user1',
        tenants: {
          global_tenant: true,
          user1: true,
        },
      };
      const expectedNamespaces = [
        {
          id: GLOBAL_USER_DICT.Value,
          name: GLOBAL_USER_DICT.Label,
        },
        {
          id: `${PRIVATE_USER_DICT.Value}user1`,
          name: PRIVATE_USER_DICT.Label,
        },
        {
          id: 'default',
          name: 'default',
        },
      ];
      const result = getNamespacesToRegister(authInfo);
      expect(result).toMatchObject(expectedNamespaces);
    });
  });
});
