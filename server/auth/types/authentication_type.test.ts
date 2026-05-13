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

import { SecurityPluginConfigType } from '../..';
import { AuthenticationType } from './authentication_type';
import { httpServerMock } from '../../../../../src/core/server/mocks';
import { OpenSearchDashboardsRequest } from '../../../../../src/core/server';
import * as tenantResolver from '../../multitenancy/tenant_resolver';

class DummyAuthType extends AuthenticationType {
  authNotRequired(request: OpenSearchDashboardsRequest): boolean {
    return false;
  }
  buildAuthHeaderFromCookie() {}
  getAdditionalAuthHeader() {}
  handleUnauthedRequest() {}
  getCookie() {
    return {};
  }
  isValidCookie() {
    return Promise.resolve(true);
  }
  requestIncludesAuthInfo() {
    return false;
  }
  resolveTenant(): Promise<string | undefined> {
    return Promise.resolve('dummy_tenant');
  }
}

describe('test tenant header', () => {
  const config = {
    multitenancy: {
      enabled: true,
    },
    auth: {
      unauthenticated_routes: [] as string[],
    },
    session: {
      keepalive: false,
    },
  } as SecurityPluginConfigType;
  const sessionStorageFactory = {
    asScoped: jest.fn(() => {
      return {
        clear: jest.fn(),
        get: () => {
          return {
            tenant: 'dummy_tenant',
          };
        },
      };
    }),
  };
  const router = jest.fn();
  const esClient = {
    asScoped: jest.fn().mockImplementation(() => {
      return {
        callAsCurrentUser: jest.fn().mockImplementation(() => {
          return { username: 'dummy-username' };
        }),
      };
    }),
  };
  const coreSetup = jest.fn();
  const logger = {
    error: jest.fn(),
  };

  const dummyAuthType = new DummyAuthType(
    config,
    sessionStorageFactory,
    router,
    esClient,
    coreSetup,
    logger
  );

  it(`common API includes tenant info`, async () => {
    const request = httpServerMock.createOpenSearchDashboardsRequest({
      path: '/api/v1',
    });
    const response = jest.fn();
    const toolkit = {
      authenticated: jest.fn((value) => value),
    };
    const result = await dummyAuthType.authHandler(request, response, toolkit);
    expect(result.requestHeaders.securitytenant).toEqual('dummy_tenant');
  });

  it(`internal API includes tenant info`, async () => {
    const request = httpServerMock.createOpenSearchDashboardsRequest({
      path: '/internal/v1',
    });
    const response = jest.fn();
    const toolkit = {
      authenticated: jest.fn((value) => value),
    };
    const result = await dummyAuthType.authHandler(request, response, toolkit);
    expect(result.requestHeaders.securitytenant).toEqual('dummy_tenant');
  });
});

describe('test capabilities request authinfo', () => {
  const config = {
    auth: {
      unauthenticated_routes: [] as string[],
    },
    session: {
      keepalive: false,
    },
  } as SecurityPluginConfigType;
  const sessionStorageFactory = {
    asScoped: jest.fn(() => {
      return {
        clear: jest.fn(),
        get: jest.fn().mockResolvedValue({}),
      };
    }),
  };
  const router = jest.fn();
  const esClient = {
    asScoped: jest.fn().mockImplementation(() => {
      return {
        callAsCurrentUser: jest.fn().mockImplementation(() => {
          return { username: 'capabilities-username' };
        }),
      };
    }),
  };
  const coreSetup = jest.fn();
  const logger = {
    error: jest.fn(),
  };

  const dummyAuthType = new DummyAuthType(
    config,
    sessionStorageFactory,
    router,
    esClient,
    coreSetup,
    logger
  );

  it(`Capabilities API includes authinfo`, async () => {
    const request = httpServerMock.createOpenSearchDashboardsRequest({
      path: '/api/core/capabilities',
    });
    const response = jest.fn();
    const toolkit = {
      authenticated: jest.fn((value) => value),
    };
    const result = await dummyAuthType.authHandler(request, response, toolkit);
    expect(result.state.authInfo.username).toEqual('capabilities-username');
  });
});

describe('resolveTenant preferred_tenants precedence', () => {
  const config = {
    multitenancy: {
      enabled: true,
      tenants: {
        preferred: ['Private', 'Global'],
      },
    },
    auth: {
      unauthenticated_routes: [] as string[],
    },
    session: {
      keepalive: false,
      ttl: 1000,
    },
    readonly_mode: {
      roles: [],
    },
  } as SecurityPluginConfigType;

  const sessionStorageFactory = {
    asScoped: jest.fn(() => ({
      clear: jest.fn(),
      get: jest.fn().mockResolvedValue({}),
      set: jest.fn(),
    })),
  };

  const router = jest.fn();
  const esClient = {
    asScoped: jest.fn().mockImplementation(() => ({
      callAsCurrentUser: jest.fn(),
    })),
  };
  const coreSetup = jest.fn();
  const logger = {
    error: jest.fn(),
  };

  beforeEach(() => {
    jest.restoreAllMocks();
  });

  it('prefers dynamic preferred_tenants from dashboardsinfo', async () => {
    const dummyAuthType = new DummyAuthType(
      config,
      sessionStorageFactory,
      router,
      esClient as any,
      coreSetup as any,
      logger as any
    );

    const resolveSpy = jest.spyOn(tenantResolver, 'resolveTenant').mockReturnValue('__user__');

    jest.spyOn((dummyAuthType as any).securityClient, 'dashboardsinfo').mockResolvedValue({
      multitenancy_enabled: true,
      private_tenant_enabled: true,
      default_tenant: '',
      preferred_tenants: ['tenant1', 'tenant2'],
    });

    const request = httpServerMock.createOpenSearchDashboardsRequest({ path: '/app/home' });

    await AuthenticationType.prototype.resolveTenant.call(
      dummyAuthType,
      request,
      { tenant: undefined } as any,
      {},
      {
        user_name: 'testuser',
        roles: ['all_access'],
        tenants: { global_tenant: true, testuser: true },
      }
    );

    expect(resolveSpy).toHaveBeenCalledWith(
      expect.objectContaining({ preferredTenants: ['tenant1', 'tenant2'] })
    );
  });

  it('falls back to config preferred tenants when dashboardsinfo field is missing', async () => {
    const dummyAuthType = new DummyAuthType(
      config,
      sessionStorageFactory,
      router,
      esClient as any,
      coreSetup as any,
      logger as any
    );

    const resolveSpy = jest.spyOn(tenantResolver, 'resolveTenant').mockReturnValue('__user__');

    jest.spyOn((dummyAuthType as any).securityClient, 'dashboardsinfo').mockResolvedValue({
      multitenancy_enabled: true,
      private_tenant_enabled: true,
      default_tenant: '',
    });

    const request = httpServerMock.createOpenSearchDashboardsRequest({ path: '/app/home' });

    await AuthenticationType.prototype.resolveTenant.call(
      dummyAuthType,
      request,
      { tenant: undefined } as any,
      {},
      {
        user_name: 'testuser',
        roles: ['all_access'],
        tenants: { global_tenant: true, testuser: true },
      }
    );

    expect(resolveSpy).toHaveBeenCalledWith(
      expect.objectContaining({ preferredTenants: ['Private', 'Global'] })
    );
  });
});
