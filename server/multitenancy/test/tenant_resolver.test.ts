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

import { resolve, resolveTenant } from '../tenant_resolver';
import { GLOBAL_TENANT_SYMBOL, PRIVATE_TENANT_SYMBOL } from '../../../common';

describe("Resolve tenants when multitenancy is enabled and both 'Global' and 'Private' tenants are disabled", () => {
  function resolveWithConfig(config: any) {
    return resolve(
      config.username,
      config.requestedTenant,
      config.preferredTenants,
      config.availableTenants,
      config.globalTenantEnabled,
      config.multitenancy_enabled,
      config.privateTenantEnabled
    );
  }

  it('Resolve tenant with custom tenants, Global and Private disabled', () => {
    const adminConfig = {
      username: 'admin',
      requestedTenant: 'admin_tenant',
      preferredTenants: undefined,
      availableTenants: { global_tenant: true, admin_tenant: true, test_tenant: true, admin: true },
      globalTenantEnabled: false,
      multitenancy_enabled: true,
      privateTenantEnabled: false,
    };

    const adminResult = resolveWithConfig(adminConfig);
    expect(adminResult).toEqual('admin_tenant');
  });

  it('Resolve tenant without custom tenants, Global and Private disabled', () => {
    const nonadminConfig = {
      username: 'testuser',
      requestedTenant: undefined,
      preferredTenants: undefined,
      availableTenants: { global_tenant: true, testuser: true },
      globalTenantEnabled: false,
      multitenancy_enabled: true,
      privateTenantEnabled: false,
    };

    const nonadminResult = resolveWithConfig(nonadminConfig);
    expect(nonadminResult).toEqual('global_tenant');
  });

  it('Resolve tenant with multitenancy disabled and global tenant enabled', () => {
    const adminConfig = {
      username: 'admin',
      requestedTenant: undefined,
      preferredTenants: undefined,
      availableTenants: { global_tenant: true, testuser: true },
      globalTenantEnabled: true,
      multitenancy_enabled: false,
      privateTenantEnabled: false,
    };

    const adminResult = resolveWithConfig(adminConfig);
    expect(adminResult).toEqual('');
  });
});

describe("Resolve tenants when multitenancy is enabled and both 'Global' and 'Private' tenants are enabled", () => {
  function resolveWithConfig(config: any) {
    return resolve(
      config.username,
      config.requestedTenant,
      config.preferredTenants,
      config.availableTenants,
      config.globalTenantEnabled,
      config.multitenancy_enabled,
      config.privateTenantEnabled
    );
  }

  it('Resolve tenant when requested tenant is Private but preferred tenant is Global', () => {
    const nonadminConfig = {
      username: 'testuser',
      requestedTenant: 'Private',
      preferredTenants: ['Global', 'Private'],
      availableTenants: { global_tenant: true, testuser: true },
      globalTenantEnabled: true,
      multitenancy_enabled: true,
      privateTenantEnabled: true,
    };

    const nonadminResult = resolveWithConfig(nonadminConfig);
    expect(nonadminResult).toEqual('__user__');
  });

  it('Resolve tenant when requested tenant is Global but preferred tenant is Private', () => {
    const nonadminConfig = {
      username: 'testuser',
      requestedTenant: 'Global',
      preferredTenants: ['Private', 'Global'],
      availableTenants: { global_tenant: true, testuser: true },
      globalTenantEnabled: true,
      multitenancy_enabled: true,
      privateTenantEnabled: true,
    };

    const nonadminResult = resolveWithConfig(nonadminConfig);
    expect(nonadminResult).toEqual('');
  });

  it('Resolve tenant when requested tenant is undefined but preferred tenant is Private', () => {
    const nonadminConfig = {
      username: 'testuser',
      requestedTenant: undefined,
      preferredTenants: ['Private', 'Global'],
      availableTenants: { global_tenant: true, testuser: true },
      globalTenantEnabled: true,
      multitenancy_enabled: true,
      privateTenantEnabled: true,
    };

    const nonadminResult = resolveWithConfig(nonadminConfig);
    expect(nonadminResult).toEqual('__user__');
  });

  it('Resolve tenant when requested tenant is undefined but preferred tenant is Global', () => {
    const nonadminConfig = {
      username: 'testuser',
      requestedTenant: undefined,
      preferredTenants: ['Global', 'Private'],
      availableTenants: { global_tenant: true, testuser: true },
      globalTenantEnabled: true,
      multitenancy_enabled: true,
      privateTenantEnabled: true,
    };

    const nonadminResult = resolveWithConfig(nonadminConfig);
    expect(nonadminResult).toEqual('');
  });
});

describe('resolveTenant private tenant availability', () => {
  function resolvePrivateRequest(ymlPrivateEnabled: boolean, backendPrivateEnabled: boolean) {
    return resolveTenant({
      request: { headers: { securitytenant: PRIVATE_TENANT_SYMBOL } },
      username: 'user1',
      roles: [],
      availableTenants: { global_tenant: true, user1: true },
      config: {
        multitenancy: { tenants: { enable_global: true, enable_private: ymlPrivateEnabled } },
      } as any,
      cookie: {} as any,
      multitenancyEnabled: true,
      privateTenantEnabled: backendPrivateEnabled,
      defaultTenant: undefined,
      preferredTenants: undefined,
    });
  }

  it('resolves the private tenant when both the yml and the backend settings enable it', () => {
    expect(resolvePrivateRequest(true, true)).toEqual(PRIVATE_TENANT_SYMBOL);
  });

  it('falls back to the global tenant when the yml setting disables the private tenant', () => {
    expect(resolvePrivateRequest(false, true)).toEqual(GLOBAL_TENANT_SYMBOL);
  });

  it('falls back to the global tenant when the backend setting disables the private tenant', () => {
    expect(resolvePrivateRequest(true, false)).toEqual(GLOBAL_TENANT_SYMBOL);
  });
});
