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

import { getAuthenticationHandler } from '../../auth_handler_factory';
import { JWT_DEFAULT_EXTRA_STORAGE_OPTIONS } from './jwt_auth';
import {
  CoreSetup,
  ILegacyClusterClient,
  IRouter,
  Logger,
  OpenSearchDashboardsRequest,
  SessionStorageFactory,
} from '../../../../../../src/core/server';
import { SecuritySessionCookie } from '../../../session/security_cookie';
import { SecurityPluginConfigType } from '../../../index';
import { httpServerMock } from '../../../../../../src/core/server/http/http_server.mocks';
import { deflateValue } from '../../../utils/compression';

describe('test jwt auth library', () => {
  const router: Partial<IRouter> = { post: (body) => {} };
  const core = {
    http: {
      basePath: {
        serverBasePath: '/',
      },
    },
  } as CoreSetup;
  let esClient: ILegacyClusterClient;
  const sessionStorageFactory: SessionStorageFactory<SecuritySessionCookie> = {
    asScoped: jest.fn().mockImplementation(() => {
      return {
        server: {
          states: {
            add: jest.fn(),
          },
        },
      };
    }),
  };
  let logger: Logger;

  const cookieConfig: Partial<SecurityPluginConfigType> = {
    cookie: {
      secure: false,
      name: 'test_cookie_name',
      password: 'secret',
      ttl: 60 * 60 * 1000,
      domain: null,
      isSameSite: false,
    },
  };

  function getTestJWTAuthenticationHandlerWithConfig(config: SecurityPluginConfigType) {
    return getAuthenticationHandler(
      'jwt',
      router as IRouter,
      config,
      core,
      esClient,
      sessionStorageFactory,
      logger
    );
  }

  test('test getTokenFromUrlParam', async () => {
    const config = {
      ...cookieConfig,
      jwt: {
        header: 'Authorization',
        url_param: 'authorization',
        extra_storage: {
          cookie_prefix: JWT_DEFAULT_EXTRA_STORAGE_OPTIONS.cookiePrefix,
          additional_cookies: JWT_DEFAULT_EXTRA_STORAGE_OPTIONS.additionalCookies,
        },
      },
    };
    const auth = await getTestJWTAuthenticationHandlerWithConfig(config);

    const url = new URL('http://localhost:5601/app/api/v1/auth/authinfo?authorization=testtoken');
    const request = {
      url,
    };

    const expectedToken = 'testtoken';
    const token = auth.getTokenFromUrlParam(request);
    expect(token).toEqual(expectedToken);
  });

  test('test getTokenFromUrlParam incorrect url_param', async () => {
    const config = {
      ...cookieConfig,
      jwt: {
        header: 'Authorization',
        url_param: 'urlParamName',
        extra_storage: {
          cookie_prefix: JWT_DEFAULT_EXTRA_STORAGE_OPTIONS.cookiePrefix,
          additional_cookies: JWT_DEFAULT_EXTRA_STORAGE_OPTIONS.additionalCookies,
        },
      },
    };
    const auth = await getTestJWTAuthenticationHandlerWithConfig(config);

    const url = new URL('http://localhost:5601/app/api/v1/auth/authinfo?authorization=testtoken');
    const request = {
      url,
    };

    const expectedToken = undefined;
    const token = auth.getTokenFromUrlParam(request);
    expect(token).toEqual(expectedToken);
  });

  test('make sure that cookies with authHeaderValue instead of split cookies are still valid', async () => {
    const config = {
      ...cookieConfig,
      jwt: {
        header: 'Authorization',
        url_param: 'authorization',
        extra_storage: {
          cookie_prefix: JWT_DEFAULT_EXTRA_STORAGE_OPTIONS.cookiePrefix,
          additional_cookies: JWT_DEFAULT_EXTRA_STORAGE_OPTIONS.additionalCookies,
        },
      },
    } as SecurityPluginConfigType;

    const jwtAuthentication = await getTestJWTAuthenticationHandlerWithConfig(config);

    const mockRequest = httpServerMock.createRawRequest();
    const osRequest = OpenSearchDashboardsRequest.from(mockRequest);

    const cookie: SecuritySessionCookie = {
      credentials: {
        authHeaderValue: 'Bearer eyToken',
      },
    };

    const expectedHeaders = {
      authorization: 'Bearer eyToken',
    };

    const headers = jwtAuthentication.buildAuthHeaderFromCookie(cookie, osRequest);

    expect(headers).toEqual(expectedHeaders);
  });

  test('get authHeaderValue from split cookies', async () => {
    const config = {
      ...cookieConfig,
      jwt: {
        header: 'Authorization',
        url_param: 'authorization',
        extra_storage: {
          cookie_prefix: 'testcookie',
          additional_cookies: 2,
        },
      },
    } as SecurityPluginConfigType;

    const jwtAuthentication = await getTestJWTAuthenticationHandlerWithConfig(config);

    const testString = 'Bearer eyCombinedToken';
    const testStringBuffer: Buffer = deflateValue(testString);
    const cookieValue = testStringBuffer.toString('base64');
    const cookiePrefix = config.jwt!.extra_storage.cookie_prefix;
    const splitValueAt = Math.ceil(
      cookieValue.length / config.jwt!.extra_storage.additional_cookies
    );
    const mockRequest = httpServerMock.createRawRequest({
      state: {
        [cookiePrefix + '1']: cookieValue.substring(0, splitValueAt),
        [cookiePrefix + '2']: cookieValue.substring(splitValueAt),
      },
    });

    const osRequest = OpenSearchDashboardsRequest.from(mockRequest);

    const cookie: SecuritySessionCookie = {
      credentials: {
        authHeaderValueExtra: true,
      },
    };

    const expectedHeaders = {
      authorization: testString,
    };

    const headers = jwtAuthentication.buildAuthHeaderFromCookie(cookie, osRequest);

    expect(headers).toEqual(expectedHeaders);
  });
});
