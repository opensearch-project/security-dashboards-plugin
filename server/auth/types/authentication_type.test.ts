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
import { SecuritySessionCookie } from '../../session/security_cookie';

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
  public supportsKeepAlive(request: OpenSearchDashboardsRequest): Promise<boolean> {
    return Promise.resolve(true);
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

  it(`keepalive should not shorten the cookie expiry`, async () => {
    const realDateNow = Date.now.bind(global.Date);
    const dateNowStub = jest.fn(() => 0);
    global.Date.now = dateNowStub;

    const keepAliveConfig = {
      multitenancy: {
        enabled: true,
      },
      auth: {
        unauthenticated_routes: [] as string[],
      },
      session: {
        keepalive: true,
        ttl: 1000,
      },
    } as SecurityPluginConfigType;
    const keepAliveDummyAuth = new DummyAuthType(
      keepAliveConfig,
      new BrowserSessionStorageFactory('security_cookie'),
      router,
      esClient,
      coreSetup,
      logger
    );
    const testCookie: SecuritySessionCookie = {
      credentials: {
        authHeaderValueExtra: true,
      },
      expiryTime: 2000,
    };
    // Set cookie
    sessionStorage.setItem('security_cookie', JSON.stringify(testCookie));
    const request = httpServerMock.createOpenSearchDashboardsRequest({
      path: '/internal/v1',
    });
    const response = jest.fn();
    const toolkit = {
      authenticated: jest.fn((value) => value),
    };
    await keepAliveDummyAuth.authHandler(request, response, toolkit);
    const cookieAfterRequest = sessionStorage.getItem('security_cookie');
    expect(JSON.parse(cookieAfterRequest!).expiryTime).toBe(2000);
    global.Date.now = realDateNow;
  });
});
