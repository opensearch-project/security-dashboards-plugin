/*
 * SPDX-License-Identifier: Apache-2.0
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
import { opensearchDashboardsResponseFactory } from '../../../../../../src/core/server/http/router/response';
import { captureRoutes } from '../../../../test/helper/route_capture';
import { CoreSetup, SessionStorageFactory } from '../../../../../../src/core/server';
import { SecurityPluginConfigType } from '../../../index';
import { SecuritySessionCookie } from '../../../session/security_cookie';
import { SecurityClient } from '../../../backend/opensearch_security_client';
import { ProxyAuthRoutes } from './routes';

function setup(config: Partial<SecurityPluginConfigType> = {}, serverBasePath = '/osd') {
  const capture = captureRoutes();
  const clear = jest.fn();
  const sessionStorageFactory = {
    asScoped: jest.fn(() => ({ clear })),
  } as unknown as SessionStorageFactory<SecuritySessionCookie>;
  const coreSetup = { http: { basePath: { serverBasePath } } } as unknown as CoreSetup;

  new ProxyAuthRoutes(
    capture.router,
    config as SecurityPluginConfigType,
    sessionStorageFactory,
    {} as unknown as SecurityClient,
    coreSetup
  ).setupRoutes();

  const response = {
    ...opensearchDashboardsResponseFactory,
    redirected: jest.fn(opensearchDashboardsResponseFactory.redirected),
    badRequest: jest.fn(opensearchDashboardsResponseFactory.badRequest),
    ok: jest.fn(opensearchDashboardsResponseFactory.ok),
  };
  return { routes: capture.routes, response, clear, sessionStorageFactory };
}

describe('ProxyAuthRoutes', () => {
  test('registers the login and logout routes', () => {
    const { routes } = setup();
    expect(Object.keys(routes).sort()).toEqual([
      'GET /auth/proxy/login',
      'POST /auth/proxy/logout',
    ]);
    expect(routes['GET /auth/proxy/login'].config.options.authRequired).toBe('optional');
    expect(routes['POST /auth/proxy/logout'].config.validate).toBe(false);
  });

  describe('login', () => {
    test('redirects an unauthenticated request to the configured login endpoint', async () => {
      const { routes, response } = setup({
        proxycache: { login_endpoint: 'https://idp.example.com/login' },
      } as any);
      const request = httpServerMock.createOpenSearchDashboardsRequest({
        auth: { isAuthenticated: false },
      });

      const res = await routes['GET /auth/proxy/login'].handler({}, request, response);

      expect(res.status).toBe(302);
      expect(res.options.headers.location).toBe('https://idp.example.com/login');
      expect(response.redirected).toHaveBeenCalledTimes(1);
    });

    test('returns bad request when no login endpoint is configured', async () => {
      const { routes, response } = setup({});
      const request = httpServerMock.createOpenSearchDashboardsRequest({
        auth: { isAuthenticated: false },
      });

      const res = await routes['GET /auth/proxy/login'].handler({}, request, response);

      expect(res.status).toBe(400);
      expect(response.redirected).not.toHaveBeenCalled();
    });

    test('redirects an authenticated request to the requested nextUrl', async () => {
      const { routes, response } = setup({});
      const request = httpServerMock.createOpenSearchDashboardsRequest({
        auth: { isAuthenticated: true },
        query: { nextUrl: '/osd/app/discover' },
      });

      const res = await routes['GET /auth/proxy/login'].handler({}, request, response);

      expect(res.status).toBe(302);
      expect(res.options.headers.location).toBe('/osd/app/discover');
      expect(response.redirected).toHaveBeenCalledTimes(1);
      expect(response.badRequest).not.toHaveBeenCalled();
    });

    test('defaults the nextUrl of an authenticated request to the dashboards app', async () => {
      const { routes, response } = setup({});
      const request = httpServerMock.createOpenSearchDashboardsRequest({
        auth: { isAuthenticated: true },
      });

      const res = await routes['GET /auth/proxy/login'].handler({}, request, response);

      expect(res.status).toBe(302);
      expect(res.options.headers.location).toBe('/osd/app/opensearch-dashboards');
      expect(response.badRequest).not.toHaveBeenCalled();
    });

    test('redirects an authenticated request to nextUrl even when a login endpoint is set', async () => {
      const { routes, response } = setup({
        proxycache: { login_endpoint: 'https://idp.example.com/login' },
      } as any);
      const request = httpServerMock.createOpenSearchDashboardsRequest({
        auth: { isAuthenticated: true },
        query: { nextUrl: '/osd/app/discover' },
      });

      const res = await routes['GET /auth/proxy/login'].handler({}, request, response);

      expect(res.status).toBe(302);
      expect(res.options.headers.location).toBe('/osd/app/discover');
      expect(response.redirected).toHaveBeenCalledTimes(1);
    });

    test('validates nextUrl against the server base path', () => {
      const { routes } = setup({});
      const querySchema = routes['GET /auth/proxy/login'].config.validate.query;

      expect(querySchema.validate({ nextUrl: '/osd/app/home' })).toEqual({
        nextUrl: '/osd/app/home',
      });
      expect(querySchema.validate({})).toEqual({});
      expect(() => querySchema.validate({ nextUrl: 'https://other.example.com' })).toThrow(
        /Invalid nextUrl parameter/
      );
      expect(() => querySchema.validate({ nextUrl: '/app/home' })).toThrow(
        /Invalid nextUrl parameter/
      );
    });
  });

  describe('logout', () => {
    test('clears the session cookie and returns ok', async () => {
      const { routes, response, clear, sessionStorageFactory } = setup({});
      const request = httpServerMock.createOpenSearchDashboardsRequest({ method: 'post' });

      const res = await routes['POST /auth/proxy/logout'].handler({}, request, response);

      expect(sessionStorageFactory.asScoped).toHaveBeenCalledWith(request);
      expect(clear).toHaveBeenCalledTimes(1);
      expect(res.status).toBe(200);
    });
  });
});
