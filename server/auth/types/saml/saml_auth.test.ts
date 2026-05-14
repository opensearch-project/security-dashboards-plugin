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

import { SecurityPluginConfigType } from '../../../index';
import { SecuritySessionCookie } from '../../../session/security_cookie';
import { deflateValue } from '../../../utils/compression';
import {
  AuthToolkit,
  IRouter,
  CoreSetup,
  ILegacyClusterClient,
  LifecycleResponseFactory,
  Logger,
  SessionStorageFactory,
} from '../../../../../../src/core/server';
import { SamlAuthentication } from './saml_auth';
import { coreMock } from '../../../../../../src/core/public/mocks';

describe('test SAML authHeaderValue', () => {
  let router: IRouter;
  let core: CoreSetup;
  let esClient: ILegacyClusterClient;
  let sessionStorageFactory: SessionStorageFactory<SecuritySessionCookie>;
  let logger: Logger;
  const authToolkit = ({
    next: jest.fn(),
    rewriteUrl: jest.fn(),
    render: jest.fn(),
    redirected: jest.fn(),
  } as unknown) as AuthToolkit;

  // Consistent with auth_handler_factory.test.ts
  beforeEach(() => {});

  const config = ({
    cookie: {
      secure: false,
    },
    saml: {
      extra_storage: {
        cookie_prefix: 'testcookie',
        additional_cookies: 5,
      },
    },
  } as unknown) as SecurityPluginConfigType;

  test('make sure that cookies with authHeaderValue are still valid', async () => {
    const samlAuthentication = new SamlAuthentication(
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

    const headers = samlAuthentication.buildAuthHeaderFromCookie(cookie, osRequest);

    expect(headers).toEqual(expectedHeaders);
  });

  test('get authHeaderValue from split cookies', async () => {
    const samlAuthentication = new SamlAuthentication(
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
    const cookiePrefix = config.saml.extra_storage.cookie_prefix;
    const splitValueAt = Math.ceil(
      cookieValue.length / config.saml.extra_storage.additional_cookies
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

    const headers = samlAuthentication.buildAuthHeaderFromCookie(cookie, osRequest);

    expect(headers).toEqual(expectedHeaders);
  });

  test('getKeepAliveExpiry', () => {
    const samlAuthentication = new SamlAuthentication(
      config,
      sessionStorageFactory,
      router,
      esClient,
      core,
      logger
    );

    const cookie: SecuritySessionCookie = {
      credentials: {
        authHeaderValueExtra: true,
      },
      expiryTime: 1000,
    };

    const request = httpServerMock.createOpenSearchDashboardsRequest({
      path: '/internal/v1',
    });

    expect(samlAuthentication.getKeepAliveExpiry(cookie, request)).toBe(1000);
  });

  test('auto_login=false redirects to login page instead of auto redirecting to SAML', () => {
    const mockCore = coreMock.createSetup();
    const samlAuthentication = new SamlAuthentication(
      config,
      sessionStorageFactory,
      router,
      esClient,
      mockCore,
      logger
    );

    const request = httpServerMock.createOpenSearchDashboardsRequest({
      path: '/app/dashboards',
      query: {
        auto_login: 'false',
      },
    });

    const lifecycleResponseFactory = httpServerMock.createLifecycleResponseFactory();
    const authToolKitSpy = jest.spyOn(authToolkit, 'redirected');

    samlAuthentication.handleUnauthedRequest(
      request,
      lifecycleResponseFactory as LifecycleResponseFactory,
      authToolkit
    );

    expect(authToolKitSpy).toHaveBeenCalledWith({
      location: '/app/login?nextUrl=%2Fapp%2Fdashboards%3Fauto_login%3Dfalse&auto_login=false',
      'set-cookie':
        'security_authentication=; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; Path=/',
    });
  });
});
