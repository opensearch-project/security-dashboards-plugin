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
import { JWT_DEFAULT_EXTRA_STORAGE_OPTIONS, JwtAuthentication } from './jwt_auth';
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
import { getExpirationDate } from './jwt_helper';

// TODO: add dependency to a JWT decode/encode library for easier test writing and reading
const JWT_TEST =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJleGFtcGxlLmNvbSIsInN1YiI6ImpvaG4uZG9lQGV4YW1wbGUuY29tIiwiZXhwIjo5MjA4NjkyMDAsIm5hbWUiOiJKb2huIERvZSIsInJvbGVzIjoiYWRtaW4ifQ.q8CtMfAeWOGDCGZ8UB8IIV-YM9hkDS8-pq0DSXh965I'; // A test JWT used for testing various scenarios
const JWT_TEST_NO_EXP =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJleGFtcGxlLmNvbSIsInN1YiI6ImpvaG4uZG9lQGV4YW1wbGUuY29tIiwibmFtZSI6IkpvaG4gRG9lIiwicm9sZXMiOiJhZG1pbiJ9.YDDoAKtA6wXd09zZ0aIUEt_IFvOwUd3rk4fW5aNppHM'; // A test JWT with no exp claim
const JWT_TEST_FAR_EXP =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJleGFtcGxlLmNvbSIsInN1YiI6ImpvaG4uZG9lQGV4YW1wbGUuY29tIiwiZXhwIjoxMzAwODE5MzgwMCwibmFtZSI6IkpvaG4gRG9lIiwicm9sZXMiOiJhZG1pbiJ9.ciW9WWtIaA-QJqy0flPSfMNQfGs9GEFqcNFY_LqrdII'; // A test JWT with a far off exp claim

const JWT_TEST_NEAR_EXP =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJleGFtcGxlLmNvbSIsInN1YiI6ImpvaG4uZG9lQGV4YW1wbGUuY29tIiwiZXhwIjo1MCwibmFtZSI6IkpvaG4gRG9lIiwicm9sZXMiOiJhZG1pbiJ9.96_h7V_OrO-bHzhh1DUIOJ2_J2sEI8y--cjBOBonk2o'; // A test JWT with exp claim of 50

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

describe('test jwt auth library', () => {
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
}); // re-import JWTAuth to change cookie splitter to a no-op

/* eslint-disable no-shadow, @typescript-eslint/no-var-requires */
describe('JWT Expiry Tests', () => {
  const setExtraAuthStorageMock = jest.fn();
  jest.resetModules();
  jest.doMock('../../../session/cookie_splitter', () => ({
    setExtraAuthStorage: setExtraAuthStorageMock,
  }));
  const { JwtAuthentication } = require('./jwt_auth');

  const realDateNow = Date.now.bind(global.Date);
  const dateNowStub = jest.fn(() => 0);
  global.Date.now = dateNowStub;
  const coreSetup = jest.fn();

  afterAll(() => {
    global.Date.now = realDateNow;
  });

  test('getExpirationDate', () => {
    expect(getExpirationDate(undefined, 1000)).toBe(1000); // undefined
    expect(getExpirationDate('', 1000)).toBe(1000); // empty string
    expect(getExpirationDate('Bearer ', 1000)).toBe(1000); // empty token
    expect(getExpirationDate('Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9', 1000)).toBe(1000); // malformed token with one part
    expect(getExpirationDate(`Bearer ${JWT_TEST_FAR_EXP}`, 1000)).toBe(1000); // JWT with very far expiry defaults to lower value (ttl)
    expect(getExpirationDate(`Bearer ${JWT_TEST}`, 920869200001)).toBe(920869200000); // JWT expiry is lower than the default
    expect(getExpirationDate(`Bearer ${JWT_TEST_NO_EXP}`, 1000)).toBe(1000); // JWT doesn't include a exp claim
  });

  test('JWT auth type sets expiryTime of cookie JWT exp less than ttl', async () => {
    const infiniteTTLConfig = {
      session: {
        keepalive: true,
        ttl: Infinity,
      },
      jwt: {
        url_param: 'awesome',
        header: 'AUTHORIZATION',
        extra_storage: {
          cookie_prefix: 'testcookie',
          additional_cookies: 2,
        },
      },
    } as SecurityPluginConfigType;

    const jwtAuth = new JwtAuthentication(
      infiniteTTLConfig,
      sessionStorageFactory,
      router,
      esClient,
      coreSetup,
      logger
    );

    const requestWithHeaders = httpServerMock.createOpenSearchDashboardsRequest({
      path: '/internal/v1',
      headers: {
        authorization: `Bearer ${JWT_TEST}`,
      },
    });
    const cookieFromHeaders = jwtAuth.getCookie(requestWithHeaders, {});
    expect(cookieFromHeaders.expiryTime!).toBe(920869200000);

    const requestWithJWTInUrl = httpServerMock.createOpenSearchDashboardsRequest({
      path: '/internal/v1',
      query: {
        awesome: JWT_TEST,
      },
    });
    const cookieFromURL = jwtAuth.getCookie(requestWithJWTInUrl, {});
    expect(cookieFromURL.expiryTime!).toBe(920869200000);
  });

  test('JWT auth type sets expiryTime of cookie ttl less than JWT exp', async () => {
    const lowTTLConfig = {
      session: {
        keepalive: true,
        ttl: 1000,
      },
      jwt: {
        url_param: 'awesome',
        header: 'AUTHORIZATION',
        extra_storage: {
          cookie_prefix: 'testcookie',
          additional_cookies: 2,
        },
      },
    } as SecurityPluginConfigType;

    const jwtAuth = new JwtAuthentication(
      lowTTLConfig,
      sessionStorageFactory,
      router,
      esClient,
      coreSetup,
      logger
    );

    const requestWithHeaders = httpServerMock.createOpenSearchDashboardsRequest({
      path: '/internal/v1',
      headers: {
        authorization: `Bearer ${JWT_TEST}`,
      },
    });
    const cookieFromHeaders = jwtAuth.getCookie(requestWithHeaders, {});
    expect(cookieFromHeaders.expiryTime!).toBe(1000);

    const requestWithJWTInUrl = httpServerMock.createOpenSearchDashboardsRequest({
      path: '/internal/v1',
      query: {
        awesome: JWT_TEST,
      },
    });
    const cookieFromURL = jwtAuth.getCookie(requestWithJWTInUrl, {});
    expect(cookieFromURL.expiryTime!).toBe(1000);
  });

  test('getKeepAliveExpiry', () => {
    const jwtConfig = {
      session: {
        keepalive: true,
        ttl: 100000,
      },
      jwt: {
        url_param: 'awesome',
        header: 'AUTHORIZATION',
        extra_storage: {
          cookie_prefix: 'testcookie',
          additional_cookies: 2,
        },
      },
    } as SecurityPluginConfigType;

    const jwtAuth = new JwtAuthentication(
      jwtConfig,
      sessionStorageFactory,
      router,
      esClient,
      coreSetup,
      logger
    );

    const requestWithHeaders = httpServerMock.createOpenSearchDashboardsRequest({
      path: '/internal/v1',
      headers: {
        authorization: `Bearer ${JWT_TEST}`,
      },
    });

    const cookie: SecuritySessionCookie = {
      credentials: {},
      expiryTime: 1000,
    };

    // Mock the method with a JWT with far exp
    jest.spyOn(jwtAuth, 'buildAuthHeaderFromCookie').mockReturnValue({
      authorization: `Bearer ${JWT_TEST_FAR_EXP}`,
    });

    // getKeepAliveExpiry takes on the value of the ttl, since it is less than the exp claim * 1000
    expect(jwtAuth.getKeepAliveExpiry(cookie, requestWithHeaders)).toBe(100000);

    // Mock the method with a JWT with near exp
    jest.spyOn(jwtAuth, 'buildAuthHeaderFromCookie').mockReturnValue({
      authorization: `Bearer ${JWT_TEST_NEAR_EXP}`,
    });

    // getKeepAliveExpiry takes on the value of the exp claim * 1000, since it is less than the ttl
    expect(jwtAuth.getKeepAliveExpiry(cookie, requestWithHeaders)).toBe(50000);

    // Restore the original method implementation after the test
    jwtAuth.buildAuthHeaderFromCookie.mockRestore();
  });

  /* eslint-enable no-shadow, @typescript-eslint/no-var-requires */
});
