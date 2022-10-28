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

class DummyAuthType extends AuthenticationType {
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
