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

import { createLogoutSession, getLogoutLoginUrl } from './logout_return';
import { getSecurityCookieOptions } from './security_cookie';
import { AuthenticationType } from '../auth/types/authentication_type';
import { registerLoginPageRoute } from '../auth/login/login_page';

jest.mock('../../../../src/core/server/http', () => ({ getRedirectUrl: jest.fn() }));

class LoggedOutAuthentication extends AuthenticationType {
  async init() {}
  requestIncludesAuthInfo() {
    return false;
  }
  async getAdditionalAuthHeader() {
    return {};
  }
  getCookie() {
    return {};
  }
  async isValidCookie() {
    return false;
  }
  buildAuthHeaderFromCookie() {
    return {};
  }
  handleUnauthedRequest(_request, response, _toolkit) {
    return response.unauthorized();
  }
}

describe('logout return path', () => {
  const nextUrl = '/osd/app/discover?security_tenant=team#/view/saved?_a=(query:test)';
  const config: any = {
    auth: { unauthenticated_routes: [] },
    cookie: { name: 'security', password: 'test', secure: false },
    session: { keepalive: false },
  };
  const core: any = { http: { basePath: { serverBasePath: '/osd' } } };
  afterEach(() => jest.restoreAllMocks());

  test('preserves path, query and fragment without credentials', () => {
    const cookie = createLogoutSession(nextUrl, '/osd');
    expect(Object.keys(cookie).sort()).toEqual(['expiryTime', 'logoutNextUrl']);
    const url = new URL(getLogoutLoginUrl(cookie, '/osd')!, 'https://dashboards.example');
    expect(url.pathname).toBe('/osd/app/login');
    expect(url.searchParams.get('nextUrl')).toBe(nextUrl);
    expect(url.searchParams.get('auto_login')).toBe('false');
    expect(getSecurityCookieOptions(config).validate!(cookie)).toEqual({
      isValid: true,
      path: '/',
    });
  });

  test.each([
    'https://evil.example',
    '//evil.example',
    '/osd-other/app/home',
    '/osd/\\evil.example',
  ])('does not preserve an invalid destination: %s', (next) => {
    expect(createLogoutSession(next, '/osd').logoutNextUrl).toBe('/osd');
    const url = getLogoutLoginUrl({ logoutNextUrl: next, expiryTime: Date.now() + 1000 }, '/osd')!;
    expect(new URL(url, 'https://dashboards.example').searchParams.get('nextUrl')).toBe('/osd');
  });

  test('expires after five minutes and works without a base path', () => {
    const clock = jest.spyOn(Date, 'now').mockReturnValue(1000);
    const cookie = createLogoutSession('/app/home#/dashboard', '');
    expect(cookie.expiryTime).toBe(301000);
    expect(getLogoutLoginUrl(cookie, '')).toContain('/app/login?auto_login=false');
    clock.mockReturnValue(301000);
    expect(getLogoutLoginUrl(cookie, '')).toBeUndefined();
  });

  test('background requests cannot authenticate with or consume logout state', async () => {
    const cookie = createLogoutSession(nextUrl, '/osd');
    const session = { get: jest.fn().mockResolvedValue(cookie), clear: jest.fn(), set: jest.fn() };
    const auth = new LoggedOutAuthentication(
      config,
      { asScoped: () => session } as any,
      {} as any,
      {} as any,
      core,
      {} as any
    );
    const toolkit: any = { redirected: jest.fn(), notHandled: jest.fn(), authenticated: jest.fn() };
    const response: any = { unauthorized: jest.fn() };
    await auth.authHandler({ url: { pathname: '/api/something' } } as any, response, toolkit);
    expect(response.unauthorized).toHaveBeenCalledTimes(1);
    await auth.authHandler({ url: { pathname: '/bundles/app.js' } } as any, response, toolkit);
    expect(toolkit.notHandled).toHaveBeenCalledTimes(1);
    expect(session.clear).not.toHaveBeenCalled();
    expect(toolkit.authenticated).not.toHaveBeenCalled();
    await auth.authHandler({ url: { pathname: '/' } } as any, response, toolkit);
    expect(toolkit.redirected).toHaveBeenCalledWith({
      location: getLogoutLoginUrl(cookie, '/osd'),
    });
    expect(session.clear).toHaveBeenCalledTimes(1);
  });

  test('ordinary unauthenticated requests retain their existing behavior', async () => {
    const session = { get: jest.fn().mockResolvedValue(undefined), clear: jest.fn() };
    const auth = new LoggedOutAuthentication(
      config,
      { asScoped: () => session } as any,
      {} as any,
      {} as any,
      core,
      {} as any
    );
    const response: any = { unauthorized: jest.fn() };
    await auth.authHandler({ url: { pathname: '/' } } as any, response, {} as any);
    expect(response.unauthorized).toHaveBeenCalledTimes(1);
  });

  test('a direct IdP return to the login page consumes logout state once', async () => {
    const register = jest.fn();
    const session = {
      get: jest
        .fn()
        .mockResolvedValueOnce(createLogoutSession(nextUrl, '/osd'))
        .mockResolvedValue(undefined),
      clear: jest.fn(),
    };
    registerLoginPageRoute({ http: { ...core.http, resources: { register } } } as any, config, {
      asScoped: () => session,
    } as any);
    const handler = register.mock.calls[0][1];
    const response = { redirected: jest.fn(), renderAnonymousCoreApp: jest.fn() };
    await handler({}, { query: {} }, response);
    expect(response.redirected).toHaveBeenCalledTimes(1);
    await handler({}, { query: { nextUrl, auto_login: 'false' } }, response);
    expect(response.renderAnonymousCoreApp).toHaveBeenCalledTimes(1);
  });
});
