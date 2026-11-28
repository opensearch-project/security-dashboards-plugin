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

import { OpenIdAuthRoutes } from '../auth/types/openid/routes';
import { SamlAuthRoutes } from '../auth/types/saml/routes';
import { OPENID_AUTH_LOGOUT, SAML_AUTH_LOGOUT } from '../../common';

jest.mock('../../../../src/core/server/http', () => ({ getRedirectUrl: jest.fn() }));
jest.mock('./cookie_splitter', () => ({
  clearSplitCookies: jest.fn(),
  getExtraAuthStorageValue: jest.fn(),
}));

describe('external logout return destinations', () => {
  const nextUrl = '/osd/app/discover?security_tenant=team#/view/query';
  let router: any;
  let session: any;
  let config: any;
  let core: any;
  let client: any;
  const response = { redirected: jest.fn((result) => result) };
  const context: any = { security_plugin: { logger: { error: jest.fn() } } };

  beforeEach(() => {
    jest.clearAllMocks();
    router = { get: jest.fn(), post: jest.fn() };
    session = {
      get: jest
        .fn()
        .mockResolvedValue({ username: 'user', credentials: { authHeaderValue: 'Bearer token' } }),
      clear: jest.fn(),
      set: jest.fn(),
    };
    const extraStorage = { cookie_prefix: 'extra', additional_cookies: 1 };
    config = {
      openid: { base_redirect_url: 'https://dashboards.example/osd', extra_storage: extraStorage },
      saml: { extra_storage: extraStorage },
    };
    core = {
      http: {
        basePath: { serverBasePath: '/osd' },
        resources: { register: jest.fn() },
      },
    };
    client = { authinfo: jest.fn() };
    const storage: any = { asScoped: () => session };
    new OpenIdAuthRoutes(
      router,
      config,
      storage,
      { endSessionEndpoint: 'https://idp.example/logout' },
      client,
      core,
      {} as any
    ).setupRoutes();
    new SamlAuthRoutes(router, config, storage, client, core).setupRoutes();
  });

  function registered(path: string) {
    return router.get.mock.calls.find(([options]) => options.path === path);
  }

  test('OIDC keeps post_logout_redirect_uri fixed and saves only the local destination', async () => {
    const handler = registered(OPENID_AUTH_LOGOUT)[1];
    for (const destination of [nextUrl, '/osd/app/home']) {
      const result = await handler(context, { query: { nextUrl: destination } }, response);
      const redirect = new URL(result.headers.location);
      expect(redirect.searchParams.get('post_logout_redirect_uri')).toBe(
        'https://dashboards.example/osd'
      );
      expect(redirect.searchParams.get('id_token_hint')).toBe('token');
      expect(redirect.toString()).not.toContain(encodeURIComponent(destination));
      expect(session.set).toHaveBeenLastCalledWith({
        logoutNextUrl: destination,
        expiryTime: expect.any(Number),
      });
    }
    expect(session.clear).toHaveBeenCalledTimes(2);
  });

  test('SAML preserves the return path without changing the provider logout URL', async () => {
    const signedLogoutUrl = 'https://idp.example/logout?SAMLRequest=signed&Signature=signature';
    client.authinfo.mockResolvedValue({ sso_logout_url: signedLogoutUrl });
    const result = await registered(SAML_AUTH_LOGOUT)[1](context, { query: { nextUrl } }, response);
    expect(result.headers.location).toBe(signedLogoutUrl);
    expect(session.set).toHaveBeenCalledWith({
      logoutNextUrl: nextUrl,
      expiryTime: expect.any(Number),
    });
  });

  test('SAML without provider logout returns to the base path with saved destination', async () => {
    client.authinfo.mockResolvedValue({});
    const result = await registered(SAML_AUTH_LOGOUT)[1](context, { query: { nextUrl } }, response);
    expect(result.headers.location).toBe('/osd');
    expect(session.set).toHaveBeenCalledWith({
      logoutNextUrl: nextUrl,
      expiryTime: expect.any(Number),
    });
  });

  test.each([OPENID_AUTH_LOGOUT, SAML_AUTH_LOGOUT])('validates nextUrl on %s', (path) => {
    const querySchema = registered(path)[0].validate.query;
    expect(querySchema.validate({ nextUrl })).toEqual({ nextUrl });
    expect(querySchema.validate({})).toEqual({});
    for (const invalid of ['https://evil.example', '//evil.example', '/outside/app/home']) {
      expect(() => querySchema.validate({ nextUrl: invalid })).toThrow('Invalid nextUrl');
    }
  });
});
