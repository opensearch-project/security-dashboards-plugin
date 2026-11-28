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

import { OpenIdAuthentication } from './openid_auth';
import { MultipleAuthentication } from '../multiple/multi_auth';
import { OPENID_AUTH_LOGIN, OPENID_AUTH_LOGOUT } from '../../../../common';
import { setExtraAuthStorage } from '../../../session/cookie_splitter';
import { SecurityClient } from '../../../backend/opensearch_security_client';

jest.mock('../../../../../../src/core/server/http', () => ({ getRedirectUrl: jest.fn() }));
jest.mock('../../../session/cookie_splitter', () => ({
  clearSplitCookies: jest.fn(),
  getExtraAuthStorageValue: jest.fn(),
  setExtraAuthStorage: jest.fn(),
}));
// These authentication methods are not part of the Basic + OIDC scenario.
jest.mock('../jwt/jwt_auth', () => ({ JwtAuthentication: jest.fn() }));
jest.mock('../saml/saml_auth', () => ({ SamlAuthentication: jest.fn() }));
jest.mock('../proxy/proxy_auth', () => ({ ProxyAuthentication: jest.fn() }));

describe('OIDC initialization and route recovery', () => {
  const document = {
    authorization_endpoint: 'https://idp.example/authorize',
    token_endpoint: 'https://idp.example/token',
  };
  let client: { get: jest.Mock; post: jest.Mock };
  let router: any;
  let core: any;
  let session: any;
  let storage: any;
  let logger: any;
  let config: any;
  let response: any;

  beforeEach(() => {
    jest.clearAllMocks();
    client = { get: jest.fn(), post: jest.fn() };
    jest
      .spyOn(OpenIdAuthentication.prototype as any, 'createWreckClient')
      .mockResolvedValue(client);
    router = { get: jest.fn(), post: jest.fn() };
    core = { http: { basePath: { serverBasePath: '' }, resources: { register: jest.fn() } } };
    session = {
      get: jest.fn(),
      set: jest.fn(),
      clear: jest.fn(),
      server: { states: { add: jest.fn() } },
    };
    storage = { asScoped: jest.fn(() => session) };
    logger = { info: jest.fn(), debug: jest.fn(), warn: jest.fn(), error: jest.fn() };
    config = {
      auth: { type: ['basicauth', 'openid'], multiple_auth_enabled: true },
      cookie: { password: 'test', secure: false },
      session: { ttl: 10000 },
      openid: {
        connect_url: 'https://idp.example/.well-known/openid-configuration',
        base_redirect_url: 'https://dashboards.example',
        scope: 'openid',
        header: 'authorization',
        client_id: 'dashboards',
        extra_storage: { cookie_prefix: 'oidc', additional_cookies: 1 },
      },
    };
    response = {
      customError: jest.fn((result) => result),
      redirected: jest.fn((result) => result),
    };
  });

  afterEach(() => jest.restoreAllMocks());

  function auth() {
    return new OpenIdAuthentication(config, storage, router, {} as any, core, logger);
  }

  function route(path: string) {
    return router.get.mock.calls.find(([options]) => options.path === path)[1];
  }

  test('registers routes without fetching discovery, then recovers on login', async () => {
    const clock = jest.spyOn(Date, 'now').mockReturnValue(1000);
    client.get.mockRejectedValueOnce(new Error('ECONNREFUSED')).mockResolvedValue({
      payload: JSON.stringify(document),
    });
    await auth().init();
    expect(client.get).not.toHaveBeenCalled();
    const login = route(OPENID_AUTH_LOGIN);
    const request = { query: {}, headers: {} };
    const unavailable = await login({}, request, response);
    expect(unavailable.statusCode).toBe(503);
    expect(response.redirected).not.toHaveBeenCalled();
    expect(session.set).not.toHaveBeenCalled();
    await login({}, request, response);
    expect(client.get).toHaveBeenCalledTimes(1);
    clock.mockReturnValue(6000);
    const recovered = await login({}, request, response);
    expect(recovered.headers.location).toContain(document.authorization_endpoint + '?');
    expect(client.get).toHaveBeenCalledTimes(2);
    expect(client.get).toHaveBeenCalledWith(config.openid.connect_url, {
      timeout: 5000,
      maxBytes: 1024 * 1024,
    });
    expect(
      router.get.mock.calls.filter(([options]) => options.path === OPENID_AUTH_LOGIN)
    ).toHaveLength(1);
  });

  test('Basic + OIDC initialization is independent of provider availability', async () => {
    config.auth.type = ['basicauth', 'openid'];
    // AuthType.BASIC is "basicauth".
    client.get.mockRejectedValue(new Error('ECONNREFUSED'));
    const multi = new MultipleAuthentication(config, storage, router, {} as any, core, logger);
    await multi.init();
    expect(client.get).not.toHaveBeenCalled();
    expect((multi as any).authHandlers.has('basicauth')).toBe(true);
    expect((multi as any).authHandlers.has('openid')).toBe(true);
  });

  test('rejects missing or invalid local discovery URLs at startup', async () => {
    for (const url of ['', 'not a URL', 'file:///metadata.json']) {
      config.openid.connect_url = url;
      await expect(auth().init()).rejects.toThrow();
    }
    expect(client.get).not.toHaveBeenCalled();
  });

  test('clears local session on logout even if discovery is unavailable', async () => {
    client.get.mockRejectedValue(new Error('ECONNREFUSED'));
    session.get.mockResolvedValue({ credentials: { authHeaderValue: 'Bearer token' } });
    await auth().init();
    const result = await route(OPENID_AUTH_LOGOUT)(
      { security_plugin: { logger } },
      { headers: {} },
      response
    );
    expect(session.clear).toHaveBeenCalledTimes(1);
    expect(result.headers.location).toBe('https://dashboards.example');
  });

  test('expired sessions fail closed when discovery is unavailable', async () => {
    client.get.mockRejectedValue(new Error('ECONNREFUSED'));
    const handler = auth();
    await handler.init();
    const valid = await handler.isValidCookie(
      {
        authType: 'openid',
        username: 'user',
        expiryTime: Date.now() + 10000,
        credentials: { authHeaderValue: 'Bearer token', expiryTime: 0, refresh_token: 'refresh' },
      },
      {} as any
    );
    expect(valid).toBe(false);
    expect(client.post).not.toHaveBeenCalled();
  });

  test('discovers endpoints before refreshing a session after restart', async () => {
    client.get.mockResolvedValue({ payload: JSON.stringify(document) });
    client.post.mockResolvedValue({
      res: { statusCode: 200 },
      payload: JSON.stringify({ id_token: '.eyJleHAiOjQxMDI0NDQ4MDB9.', refresh_token: 'renewed' }),
    });
    const handler = auth();
    await handler.init();
    expect(
      await handler.isValidCookie(
        {
          authType: 'openid',
          username: 'user',
          expiryTime: Date.now() + 10000,
          credentials: { authHeaderValue: 'Bearer token', expiryTime: 0, refresh_token: 'refresh' },
        },
        {} as any
      )
    ).toBe(true);
    expect(client.get).toHaveBeenCalledTimes(1);
    expect(client.post.mock.calls[0][0]).toBe(document.token_endpoint);
    expect(setExtraAuthStorage).toHaveBeenCalled();
  });

  test('callback returns 503 without exchanging a code when discovery fails', async () => {
    client.get.mockRejectedValue(new Error('ETIMEDOUT'));
    await auth().init();
    const result = await route(OPENID_AUTH_LOGIN)(
      {},
      { query: { code: 'code', state: 'state' } },
      response
    );
    expect(result.statusCode).toBe(503);
    expect(client.post).not.toHaveBeenCalled();
    expect(session.set).not.toHaveBeenCalled();
  });

  test('recovered callback still verifies state and authenticates with OpenSearch', async () => {
    const clock = jest.spyOn(Date, 'now').mockReturnValue(1000);
    client.get.mockRejectedValueOnce(new Error('ECONNREFUSED')).mockResolvedValue({
      payload: JSON.stringify(document),
    });
    client.post.mockResolvedValue({
      res: { statusCode: 200 },
      payload: JSON.stringify({ id_token: '.eyJleHAiOjQxMDI0NDQ4MDB9.' }),
    });
    const authenticate = jest
      .spyOn(SecurityClient.prototype, 'authenticateWithHeader')
      .mockResolvedValue({ username: 'user' } as any);
    await auth().init();
    const login = route(OPENID_AUTH_LOGIN);
    await login({}, { query: {} }, response);
    clock.mockReturnValue(6000);
    session.get.mockResolvedValue({ oidc: { state: 'expected', nextUrl: '/app/home' } });
    const context = { security_plugin: { logger } };
    await login(context, { query: { code: 'code', state: 'wrong' } }, response);
    expect(client.post).not.toHaveBeenCalled();
    expect(authenticate).not.toHaveBeenCalled();
    const request = { query: { code: 'code', state: 'expected' } };
    const result = await login(context, request, response);
    expect(authenticate).toHaveBeenCalledWith(
      request,
      'authorization',
      'Bearer .eyJleHAiOjQxMDI0NDQ4MDB9.'
    );
    expect(session.set).toHaveBeenCalledWith(expect.objectContaining({ username: 'user' }));
    expect(result.headers.location).toBe('/app/home');
  });

  test('logout works without a session or an IdP logout endpoint', async () => {
    client.get.mockResolvedValue({ payload: JSON.stringify(document) });
    await auth().init();
    const result = await route(OPENID_AUTH_LOGOUT)(
      { security_plugin: { logger } },
      { headers: {} },
      response
    );
    expect(session.clear).toHaveBeenCalledTimes(1);
    expect(result.headers.location).toBe('https://dashboards.example');
  });
});
