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

import { httpServerMock } from '../../../../../../src/core/server/http/http_server.mocks';

import { OpenSearchDashboardsRequest } from '../../../../../../src/core/server/http/router';

import { OpenIdAuthentication } from './openid_auth';
import { SecurityPluginConfigType } from '../../../index';
import { SecuritySessionCookie } from '../../../session/security_cookie';
import { deflateValue } from '../../../utils/compression';
import { getObjectProperties } from '../../../utils/object_properties_defined';
import {
  IRouter,
  CoreSetup,
  ILegacyClusterClient,
  SessionStorageFactory,
} from '../../../../../../src/core/server';

interface Logger {
  debug(message: string): void;
  info(message: string): void;
  warn(message: string): void;
  error(message: string): void;
  fatal(message: string): void;
}

const mockClient = { post: jest.fn() };

jest.mock('@hapi/wreck', () => ({
  defaults: jest.fn(() => mockClient),
}));

describe('test OpenId authHeaderValue', () => {
  let router: IRouter;
  let core: CoreSetup;
  let esClient: ILegacyClusterClient;
  let sessionStorageFactory: SessionStorageFactory<SecuritySessionCookie>;

  // Consistent with auth_handler_factory.test.ts
  beforeEach(() => {});

  const config = ({
    openid: {
      header: 'authorization',
      scope: [],
      extra_storage: {
        cookie_prefix: 'testcookie',
        additional_cookies: 5,
      },
    },
  } as unknown) as SecurityPluginConfigType;

  const logger = {
    debug: (message: string) => {},
    info: (message: string) => {},
    warn: (message: string) => {},
    error: (message: string) => {},
    fatal: (message: string) => {},
  };

  test('make sure that cookies with authHeaderValue are still valid', async () => {
    const openIdAuthentication = new OpenIdAuthentication(
      config,
      sessionStorageFactory,
      router,
      esClient,
      core,
      logger
    );

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

    const headers = openIdAuthentication.buildAuthHeaderFromCookie(cookie, osRequest);

    expect(headers).toEqual(expectedHeaders);
  });

  test('get authHeaderValue from split cookies', async () => {
    const openIdAuthentication = new OpenIdAuthentication(
      config,
      sessionStorageFactory,
      router,
      esClient,
      core,
      logger
    );

    const testString = 'Bearer eyCombinedToken';
    const testStringBuffer: Buffer = deflateValue(testString);
    const cookieValue = testStringBuffer.toString('base64');
    const cookiePrefix = config.openid!.extra_storage.cookie_prefix;
    const splitValueAt = Math.ceil(
      cookieValue.length / config.openid!.extra_storage.additional_cookies
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

    const headers = openIdAuthentication.buildAuthHeaderFromCookie(cookie, osRequest);

    expect(headers).toEqual(expectedHeaders);
  });

  test('Make sure that wreckClient can be configured with mTLS', async () => {
    const customConfig = {
      openid: {
        certificate: 'test/certs/cert.pem',
        private_key: 'test/certs/private-key.pem',
        header: 'authorization',
        scope: [],
      },
    };

    const openidConfig = (customConfig as unknown) as SecurityPluginConfigType;

    const openIdAuthentication = new OpenIdAuthentication(
      openidConfig,
      sessionStorageFactory,
      router,
      esClient,
      core,
      logger
    );

    const wreckHttpsOptions = openIdAuthentication.getWreckHttpsOptions();

    console.log(
      '============= PEM =============',
      '\n\n',
      getObjectProperties(customConfig.openid, 'OpenID'),
      '\n\n',
      getObjectProperties(wreckHttpsOptions, 'wreckHttpsOptions')
    );

    expect(wreckHttpsOptions.key).toBeDefined();
    expect(wreckHttpsOptions.cert).toBeDefined();
    expect(wreckHttpsOptions.pfx).toBeUndefined();
  });

  test('Ensure private key and certificate are not exposed when using PFX certificate', async () => {
    const customConfig = {
      openid: {
        pfx: 'test/certs/keyStore.p12',
        certificate: 'test/certs/cert.pem',
        private_key: 'test/certs/private-key.pem',
        passphrase: '',
        header: 'authorization',
        scope: [],
      },
    };

    const openidConfig = (customConfig as unknown) as SecurityPluginConfigType;

    const openIdAuthentication = new OpenIdAuthentication(
      openidConfig,
      sessionStorageFactory,
      router,
      esClient,
      core,
      logger
    );

    const wreckHttpsOptions = openIdAuthentication.getWreckHttpsOptions();

    console.log(
      '============= PFX =============',
      '\n\n',
      getObjectProperties(customConfig.openid, 'OpenID'),
      '\n\n',
      getObjectProperties(wreckHttpsOptions, 'wreckHttpsOptions')
    );

    expect(wreckHttpsOptions.pfx).toBeDefined();
    expect(wreckHttpsOptions.key).toBeUndefined();
    expect(wreckHttpsOptions.cert).toBeUndefined();
    expect(wreckHttpsOptions.passphrase).toBeUndefined();
  });

  test('Ensure accessToken expiryTime is being used to test validity of cookie', async () => {
    const realDateNow = Date.now.bind(global.Date);
    const dateNowStub = jest.fn(() => 0);
    global.Date.now = dateNowStub;
    const oidcConfig: unknown = {
      openid: {
        scope: [],
      },
    };

    const openIdAuthentication = new OpenIdAuthentication(
      oidcConfig as SecurityPluginConfigType,
      sessionStorageFactory,
      router,
      esClient,
      core,
      logger
    );
    const testCookie: SecuritySessionCookie = {
      credentials: {
        authHeaderValue: 'Bearer eyToken',
        expiryTime: 200,
      },
      expiryTime: 10000,
      username: 'admin',
      authType: 'openid',
    };

    // Credentials are valid because 0 < 200
    expect(await openIdAuthentication.isValidCookie(testCookie, {})).toBe(true);
    global.Date.now = realDateNow;
  });

  test('Ensure refreshToken workflow is called if current time is after access token expiry, but before session expiry', async () => {
    const realDateNow = Date.now.bind(global.Date);
    const dateNowStub = jest.fn(() => 300);
    global.Date.now = dateNowStub;
    const oidcConfig: unknown = {
      openid: {
        header: 'authorization',
        scope: [],
        extra_storage: {
          cookie_prefix: 'testcookie',
          additional_cookies: 0,
        },
      },
    };

    const openIdAuthentication = new OpenIdAuthentication(
      oidcConfig as SecurityPluginConfigType,
      sessionStorageFactory,
      router,
      esClient,
      core,
      logger
    );
    const testCookie: SecuritySessionCookie = {
      credentials: {
        authHeaderValue: 'Bearer eyToken',
        expiryTime: 200,
        refresh_token: 'refreshToken',
      },
      expiryTime: 10000,
      username: 'admin',
      authType: 'openid',
    };

    const mockRequestPayload = JSON.stringify({
      grant_type: 'refresh_token',
      client_id: 'clientId',
      client_secret: 'clientSecret',
      refresh_token: 'refreshToken',
    });
    const mockResponsePayload = JSON.stringify({
      id_token: '.eyJleHAiOiIwLjUifQ.', // Translates to {"exp":"0.5"}
      access_token: 'accessToken',
      refresh_token: 'refreshToken',
    });
    mockClient.post.mockResolvedValue({
      res: { statusCode: 200 },
      payload: mockResponsePayload,
    });

    expect(await openIdAuthentication.isValidCookie(testCookie, {})).toBe(true);
    global.Date.now = realDateNow;
  });

  test('getKeepAliveExpiry', () => {
    const oidcConfig: unknown = {
      openid: {
        scope: [],
      },
    };

    const openIdAuthentication = new OpenIdAuthentication(
      oidcConfig as SecurityPluginConfigType,
      sessionStorageFactory,
      router,
      esClient,
      core,
      logger
    );
    const testCookie: SecuritySessionCookie = {
      credentials: {
        authHeaderValue: 'Bearer eyToken',
      },
      expiryTime: 1000,
    };

    expect(openIdAuthentication.getKeepAliveExpiry(testCookie, {})).toBe(1000);
  });
});
