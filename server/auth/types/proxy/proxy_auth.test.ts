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

import { SecurityPluginConfigType } from '../../../index';
import { SecuritySessionCookie } from '../../../session/security_cookie';
import {
  IRouter,
  CoreSetup,
  ILegacyClusterClient,
  Logger,
  SessionStorageFactory,
} from '../../../../../../src/core/server';
import { ProxyAuthentication } from './proxy_auth';
import { ProxyAuthRoutes } from './routes';

jest.mock('./routes');

describe('Proxy auth tests', () => {
  let router: IRouter;
  let core: CoreSetup;
  let esClient: ILegacyClusterClient;
  let sessionStorageFactory: SessionStorageFactory<SecuritySessionCookie>;
  let logger: Logger;

  const config = ({
    session: {
      ttl: 1000,
    },
  } as unknown) as SecurityPluginConfigType;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('getKeepAliveExpiry', () => {
    const realDateNow = Date.now.bind(global.Date);
    const dateNowStub = jest.fn(() => 0);
    global.Date.now = dateNowStub;
    const proxyAuthentication = new ProxyAuthentication(
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
      expiryTime: 0,
    };

    const request = httpServerMock.createOpenSearchDashboardsRequest({
      path: '/internal/v1',
    });

    expect(proxyAuthentication.getKeepAliveExpiry(cookie, request)).toBe(1000);
    global.Date.now = realDateNow;
  });

  describe('header handling', () => {
    const proxyConfig = ({
      session: { ttl: 1000 },
      proxycache: {
        user_header: 'X-Proxy-User',
        roles_header: 'X-Proxy-Roles',
        proxy_header: 'x-forwarded-for',
        proxy_header_ip: '10.0.0.1',
        login_endpoint: 'https://idp.example.com/login',
      },
    } as unknown) as SecurityPluginConfigType;

    const newAuth = (c: SecurityPluginConfigType = proxyConfig) =>
      new ProxyAuthentication(c, sessionStorageFactory, router, esClient, core, logger);

    const requestWithHeaders = (headers: Record<string, string>) =>
      httpServerMock.createOpenSearchDashboardsRequest({ path: '/app/home', headers });

    test('init registers the proxy routes with the authentication dependencies', async () => {
      await newAuth().init();

      expect(ProxyAuthRoutes).toHaveBeenCalledTimes(1);
      const args = (ProxyAuthRoutes as jest.Mock).mock.calls[0];
      expect(args[1]).toBe(proxyConfig);
      const instance = (ProxyAuthRoutes as jest.Mock).mock.instances[0];
      expect(instance.setupRoutes).toHaveBeenCalledTimes(1);
    });

    test('requestIncludesAuthInfo needs both x-forwarded-for and the user header', () => {
      const auth = newAuth();
      expect(
        auth.requestIncludesAuthInfo(
          requestWithHeaders({ 'x-forwarded-for': '1.2.3.4', 'x-proxy-user': 'alice' })
        )
      ).toBe(true);
      expect(auth.requestIncludesAuthInfo(requestWithHeaders({ 'x-proxy-user': 'alice' }))).toBe(
        false
      );
      expect(
        auth.requestIncludesAuthInfo(requestWithHeaders({ 'x-forwarded-for': '1.2.3.4' }))
      ).toBe(false);
    });

    test('requestIncludesAuthInfo is false when no user header is configured', () => {
      const auth = newAuth(({ session: { ttl: 1000 } } as unknown) as SecurityPluginConfigType);
      expect(
        auth.requestIncludesAuthInfo(
          requestWithHeaders({ 'x-forwarded-for': '1.2.3.4', 'x-proxy-user': 'alice' })
        )
      ).toBe(false);
    });

    test('getAdditionalAuthHeader adds the proxy header ip when the request lacks the proxy header', async () => {
      const auth = newAuth();
      expect(await auth.getAdditionalAuthHeader(requestWithHeaders({}))).toEqual({
        'x-forwarded-for': '10.0.0.1',
      });
      expect(
        await auth.getAdditionalAuthHeader(requestWithHeaders({ 'x-forwarded-for': '1.2.3.4' }))
      ).toEqual({});
    });

    test('getAdditionalAuthHeader adds nothing without proxy_header_ip', async () => {
      const auth = newAuth(({
        session: { ttl: 1000 },
        proxycache: { user_header: 'x-proxy-user', proxy_header: 'x-forwarded-for' },
      } as unknown) as SecurityPluginConfigType);
      expect(await auth.getAdditionalAuthHeader(requestWithHeaders({}))).toEqual({});
    });

    test('getCookie stores the user, roles, forwarded-for and authorization headers', () => {
      const realDateNow = Date.now.bind(global.Date);
      global.Date.now = jest.fn(() => 5000);
      try {
        const cookie = newAuth().getCookie(
          requestWithHeaders({
            'x-proxy-user': 'alice',
            'x-proxy-roles': 'admin,dev',
            'x-forwarded-for': '1.2.3.4',
            authorization: 'Basic abc',
          }),
          { username: 'alice' }
        );

        expect(cookie).toEqual({
          username: 'alice',
          credentials: {
            'x-proxy-user': 'alice',
            'x-proxy-roles': 'admin,dev',
            'x-forwarded-for': '1.2.3.4',
            authorization: 'Basic abc',
          },
          authType: 'proxy',
          isAnonymousAuth: false,
          expiryTime: 6000,
        });
      } finally {
        global.Date.now = realDateNow;
      }
    });

    test('getCookie leaves out headers that the request does not carry', () => {
      const cookie = newAuth().getCookie(requestWithHeaders({ 'x-proxy-user': 'bob' }), {
        username: 'bob',
      });
      expect(cookie.credentials).toEqual({ 'x-proxy-user': 'bob' });
    });

    test('isValidCookie requires the proxy type, username, expiry and user header credential', async () => {
      const auth = newAuth();
      const valid: SecuritySessionCookie = {
        authType: 'proxy',
        username: 'alice',
        expiryTime: 10,
        credentials: { 'x-proxy-user': 'alice' },
      };
      expect(await auth.isValidCookie(valid)).toBeTruthy();
      expect(await auth.isValidCookie({ ...valid, authType: 'basicauth' })).toBeFalsy();
      expect(await auth.isValidCookie({ ...valid, username: undefined })).toBeFalsy();
      expect(await auth.isValidCookie({ ...valid, expiryTime: undefined })).toBeFalsy();
      expect(await auth.isValidCookie({ ...valid, credentials: {} })).toBeFalsy();
    });

    test('isValidCookie accepts the cookie that getCookie writes', async () => {
      const auth = newAuth();
      const cookie = auth.getCookie(
        requestWithHeaders({ 'x-proxy-user': 'alice', 'x-forwarded-for': '1.2.3.4' }),
        { username: 'alice' }
      );

      expect(await auth.isValidCookie(cookie)).toBeTruthy();
    });

    test('handleUnauthedRequest redirects to the login endpoint when configured', () => {
      const toolkit = { redirected: jest.fn(() => 'redirected'), notHandled: jest.fn() };
      const result = newAuth().handleUnauthedRequest(
        requestWithHeaders({}),
        httpServerMock.createLifecycleResponseFactory(),
        toolkit as any
      );
      expect(result).toBe('redirected');
      expect(toolkit.redirected).toHaveBeenCalledWith({
        location: 'https://idp.example.com/login',
      });
      expect(toolkit.notHandled).not.toHaveBeenCalled();
    });

    test('handleUnauthedRequest leaves the request unhandled without a login endpoint', () => {
      const toolkit = { redirected: jest.fn(), notHandled: jest.fn(() => 'notHandled') };
      const result = newAuth(config).handleUnauthedRequest(
        requestWithHeaders({}),
        httpServerMock.createLifecycleResponseFactory(),
        toolkit as any
      );
      expect(result).toBe('notHandled');
      expect(toolkit.redirected).not.toHaveBeenCalled();
    });

    test('buildAuthHeaderFromCookie forwards the stored proxy headers', () => {
      const headers = newAuth().buildAuthHeaderFromCookie(
        {
          credentials: {
            'x-proxy-user': 'alice',
            'x-proxy-roles': 'admin',
            'x-forwarded-for': '1.2.3.4',
            authorization: 'Basic abc',
          },
        },
        requestWithHeaders({})
      );
      expect(headers).toEqual({
        'x-proxy-user': 'alice',
        'x-proxy-roles': 'admin',
        'x-forwarded-for': '1.2.3.4',
      });
    });

    test('buildAuthHeaderFromCookie sends only the user header when roles and ip are missing', () => {
      const headers = newAuth().buildAuthHeaderFromCookie(
        { credentials: { 'x-proxy-user': 'alice' } },
        requestWithHeaders({})
      );
      expect(headers).toEqual({ 'x-proxy-user': 'alice' });
    });

    test('buildAuthHeaderFromCookie falls back to the authorization credential', () => {
      const headers = newAuth().buildAuthHeaderFromCookie(
        { credentials: { authorization: 'Basic abc' } },
        requestWithHeaders({})
      );
      expect(headers).toEqual({ authorization: 'Basic abc' });
    });

    test('buildAuthHeaderFromCookie returns nothing without usable credentials', () => {
      expect(
        newAuth().buildAuthHeaderFromCookie({ credentials: {} }, requestWithHeaders({}))
      ).toBeUndefined();
    });
  });
});
