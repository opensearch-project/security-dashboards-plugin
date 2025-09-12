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

import * as osdTestServer from '../../../../src/core/test_helpers/osd_server';
import { Root } from '../../../../src/core/server/root';
import { resolve } from 'path';
import { describe, expect, it, beforeAll, afterAll } from '@jest/globals';
import { SignJWT } from 'jose';
import {
  ADMIN_CREDENTIALS,
  OPENSEARCH_DASHBOARDS_SERVER_USER,
  OPENSEARCH_DASHBOARDS_SERVER_PASSWORD,
} from '../constant';
import wreck from '@hapi/wreck';
import { Builder, By, until } from 'selenium-webdriver';
import { Options } from 'selenium-webdriver/firefox';

const OSD_HOST = 'http://localhost:5601';
const OS_HOST = 'https://localhost:9200';

// Browser (accept self-signed)
const browser = 'firefox';
const options = new Options().headless().setAcceptInsecureCerts(true);

// JWT test key
const rawKey = 'This is a very secure secret. No one will ever be able to guess it!';
const signingKeyB64 = Buffer.from(rawKey).toString('base64');

// Selectors
const pageTitleXPath = '//*[@id="osdOverviewPageHeader__title"]';

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function waitForOpenSearchReady(timeoutMs = 120_000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const { res } = await wreck.get(
        `${OS_HOST}/_cluster/health?wait_for_status=yellow&timeout=1s`,
        {
          rejectUnauthorized: false,
          headers: { authorization: ADMIN_CREDENTIALS },
        }
      );
      if ((res.statusCode ?? 0) >= 200 && (res.statusCode ?? 0) < 500) return;
    } catch {
      /* ignore until timeout */
    }
    await sleep(2000);
  }
  throw new Error('OpenSearch did not become ready in time');
}

async function waitForDashboardsUp(timeoutMs = 120_000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const { res } = await wreck.get(`${OSD_HOST}/`, {
        redirects: 0,
        rejectUnauthorized: false,
      });
      if ([200, 302, 401].includes(res.statusCode ?? 0)) return;
    } catch (e: any) {
      const code = e?.output?.statusCode ?? e?.statusCode;
      if ([302, 401].includes(code)) return;
    }
    await sleep(2000);
  }
  throw new Error('OpenSearch Dashboards did not become ready in time');
}

function getDriver() {
  return new Builder()
    .forBrowser(browser)
    .setFirefoxOptions(options as any)
    .build();
}

function analyzeCookies(cookies: Array<{ name: string }>) {
  const names = cookies.map((c) => c.name);
  // Security auth cookie may be chunked: security_authentication, security_authentication.1, ...
  const authChunks = names.filter(
    (n) => n === 'security_authentication' || n.startsWith('security_authentication.')
  );
  return { names, hasAuth: authChunks.length >= 1, authChunksCount: authChunks.length };
}

describe('start OpenSearch Dashboards server (JWT via url param)', () => {
  let root: Root;
  let config: any;

  beforeAll(async () => {
    // Ensure OpenSearch is reachable before configuring
    await waitForOpenSearchReady();

    root = osdTestServer.createRootWithSettings(
      {
        plugins: { scanDirs: [resolve(__dirname, '../..')] },
        server: { host: 'localhost', port: 5601 },
        logging: { silent: true, verbose: false },
        opensearch: {
          hosts: [OS_HOST],
          ignoreVersionMismatch: true,
          ssl: { verificationMode: 'none' },
          username: OPENSEARCH_DASHBOARDS_SERVER_USER,
          password: OPENSEARCH_DASHBOARDS_SERVER_PASSWORD,
          requestHeadersWhitelist: ['authorization', 'securitytenant'],
        },
        opensearch_security: {
          auth: { anonymous_auth_enabled: false, type: 'jwt' },
          jwt: { url_param: 'token' },
        },
      },
      { dev: true }
    );

    await root.setup();
    await root.start();

    // Map role -> user for JWT subject
    await wreck.patch(`${OS_HOST}/_plugins/_security/api/rolesmapping/all_access`, {
      payload: [{ op: 'add', path: '/users', value: ['jwt_test'] }],
      rejectUnauthorized: false,
      headers: {
        'Content-Type': 'application/json',
        authorization: ADMIN_CREDENTIALS,
      },
    });

    // Fetch current security config
    const getConfigResponse = await wreck.get(`${OS_HOST}/_plugins/_security/api/securityconfig`, {
      rejectUnauthorized: false,
      headers: { authorization: ADMIN_CREDENTIALS },
    });
    const responseBody = (getConfigResponse.payload as Buffer).toString();
    config = JSON.parse(responseBody).config;

    // Inject jwt_auth_domain (HTTP)
    const jwtConfig = {
      http_enabled: true,
      transport_enabled: false,
      order: 5,
      http_authenticator: {
        challenge: true,
        type: 'jwt',
        config: {
          signing_key: signingKeyB64,
          jwt_header: 'Authorization',
          jwt_url_parameter: 'token',
          subject_key: 'sub',
          roles_key: 'roles',
        },
      },
      authentication_backend: { type: 'noop', config: {} },
    };

    config.dynamic = config.dynamic || {};
    config.dynamic.authc = config.dynamic.authc || {};
    config.dynamic.http = config.dynamic.http || {};
    config.dynamic.authc.jwt_auth_domain = jwtConfig;
    if (config.dynamic.authc.basic_internal_auth_domain?.http_authenticator) {
      config.dynamic.authc.basic_internal_auth_domain.http_authenticator.challenge = false;
    }
    config.dynamic.http.anonymous_auth_enabled = false;

    try {
      await wreck.put(`${OS_HOST}/_plugins/_security/api/securityconfig/config`, {
        payload: config,
        rejectUnauthorized: false,
        headers: {
          'Content-Type': 'application/json',
          authorization: ADMIN_CREDENTIALS,
        },
      });
    } catch (error: any) {
      console.log('Got an error while updating security config!!', error.stack);
      throw error;
    }

    // Wait for OSD listener after plugin init
    await waitForDashboardsUp();
  }, 240_000);

  afterAll(async () => {
    try {
      await wreck.patch(`${OS_HOST}/_plugins/_security/api/rolesmapping/all_access`, {
        payload: [{ op: 'remove', path: '/users', users: ['jwt_test'] }],
        rejectUnauthorized: false,
        headers: {
          'Content-Type': 'application/json',
          authorization: ADMIN_CREDENTIALS,
        },
      });
    } catch {
      /* ignore */
    }
    try {
      await wreck.patch(`${OS_HOST}/_plugins/_security/api/securityconfig`, {
        payload: [{ op: 'remove', path: '/config/dynamic/authc/jwt_auth_domain' }],
        rejectUnauthorized: false,
        headers: {
          'Content-Type': 'application/json',
          authorization: ADMIN_CREDENTIALS,
        },
      });
    } catch {
      /* ignore */
    }
    await root.shutdown();
  });

  it('Login to app/opensearch_dashboards_overview#/ when JWT is enabled', async () => {
    const token = await new SignJWT({ sub: 'jwt_test', roles: 'admin,kibanauser' })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .sign(new TextEncoder().encode(rawKey));

    const driver = getDriver();
    await driver.get(`${OSD_HOST}/app/opensearch_dashboards_overview?token=${token}`);
    await driver.wait(until.elementsLocated(By.xpath(pageTitleXPath)), 30_000);

    const cookies = await driver.manage().getCookies();
    const { hasAuth, authChunksCount, names } = analyzeCookies(cookies);
    expect(hasAuth).toBe(true);
    expect(authChunksCount).toBeGreaterThanOrEqual(1);
    if (process.platform === 'win32') {
      console.log('Cookie names (Windows):', names);
    }

    await driver.manage().deleteAllCookies();
    await driver.quit();
  }, 60_000);

  it('Login to app/dev_tools#/console when JWT is enabled', async () => {
    const token = await new SignJWT({ sub: 'jwt_test', roles: 'admin,kibanauser' })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .sign(new TextEncoder().encode(rawKey));

    const driver = getDriver();
    await driver.get(`${OSD_HOST}/app/dev_tools?token=${token}`);
    await driver.wait(
      until.elementsLocated(By.xpath('//*[@data-test-subj="sendRequestButton"]')),
      30_000
    );

    const cookies = await driver.manage().getCookies();
    const { hasAuth, authChunksCount } = analyzeCookies(cookies);
    expect(hasAuth).toBe(true);
    expect(authChunksCount).toBeGreaterThanOrEqual(1);

    await driver.manage().deleteAllCookies();
    await driver.quit();
  }, 60_000);

  it('Login to overview with invalid token → 401', async () => {
    const token = await new SignJWT({ sub: 'jwt_test', roles: 'admin,kibanauser' })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .sign(new TextEncoder().encode('wrongKey'));

    const driver = getDriver();
    await driver.get(`${OSD_HOST}/app/opensearch_dashboards_overview?token=${token}`);

    // Accept modern JSON 401 page
    const src = await driver.getPageSource();
    expect(src).toMatch(/401/);
    expect(src).toMatch(/Unauthorized/i);

    const cookies = await driver.manage().getCookies();
    const { hasAuth, authChunksCount } = analyzeCookies(cookies);
    expect(hasAuth).toBe(false);
    expect(authChunksCount).toEqual(0);

    await driver.manage().deleteAllCookies();
    await driver.quit();
  }, 60_000);

  it('Login to dev_tools with invalid token → 401', async () => {
    const token = await new SignJWT({ sub: 'jwt_test', roles: 'admin,kibanauser' })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .sign(new TextEncoder().encode('wrongKey'));

    const driver = getDriver();
    await driver.get(`${OSD_HOST}/app/dev_tools?token=${token}`);

    const src = await driver.getPageSource();
    expect(src).toMatch(/401/);
    expect(src).toMatch(/Unauthorized/i);

    const cookies = await driver.manage().getCookies();
    const { hasAuth, authChunksCount } = analyzeCookies(cookies);
    expect(hasAuth).toBe(false);
    expect(authChunksCount).toEqual(0);

    await driver.manage().deleteAllCookies();
    await driver.quit();
  }, 60_000);

  it('Login to overview with many roles (cookie chunking)', async () => {
    const roles: string[] = ['admin'];
    for (let i = 0; i < 500; i++) roles.push(Math.random().toString(20).substr(2, 10));
    const token = await new SignJWT({ sub: 'jwt_test', roles: roles.join(',') })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .sign(new TextEncoder().encode(rawKey));

    const driver = getDriver();
    await driver.get(`${OSD_HOST}/app/opensearch_dashboards_overview?token=${token}`);
    await driver.wait(until.elementsLocated(By.xpath(pageTitleXPath)), 30_000);

    const cookies = await driver.manage().getCookies();
    const { hasAuth, authChunksCount } = analyzeCookies(cookies);
    expect(hasAuth).toBe(true);
    expect(authChunksCount).toBeGreaterThan(0);

    await driver.manage().deleteAllCookies();
    await driver.quit();
  }, 90_000);
});
