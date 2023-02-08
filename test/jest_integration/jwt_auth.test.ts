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

describe('start OpenSearch Dashboards server', () => {
  let root: Root;
  let config;

  // XPath Constants
  const pageTitleXPath = '//*[@id="osdOverviewPageHeader__title"]';
  // Browser Settings
  const browser = 'firefox';
  const options = new Options().headless();
  const rawKey = 'This is a very secure secret. No one will ever be able to guess it!';
  const b = Buffer.from(rawKey);
  const signingKey = b.toString('base64');

  beforeAll(async () => {
    root = osdTestServer.createRootWithSettings(
      {
        plugins: {
          scanDirs: [resolve(__dirname, '../..')],
        },
        server: {
          host: 'localhost',
          port: 5601,
        },
        logging: {
          silent: true,
          verbose: false,
        },
        opensearch: {
          hosts: ['https://localhost:9200'],
          ignoreVersionMismatch: true,
          ssl: { verificationMode: 'none' },
          username: OPENSEARCH_DASHBOARDS_SERVER_USER,
          password: OPENSEARCH_DASHBOARDS_SERVER_PASSWORD,
          requestHeadersWhitelist: ['authorization', 'securitytenant'],
        },
        opensearch_security: {
          auth: {
            anonymous_auth_enabled: false,
            type: 'jwt',
          },
          jwt: {
            url_param: 'token',
          },
        },
      },
      {
        // to make ignoreVersionMismatch setting work
        // can be removed when we have corresponding ES version
        dev: true,
      }
    );

    console.log('Starting OpenSearchDashboards server..');
    await root.setup();
    await root.start();

    await wreck.patch('https://localhost:9200/_plugins/_security/api/rolesmapping/all_access', {
      payload: [
        {
          op: 'add',
          path: '/users',
          value: ['jwt_test'],
        },
      ],
      rejectUnauthorized: false,
      headers: {
        'Content-Type': 'application/json',
        authorization: ADMIN_CREDENTIALS,
      },
    });
    console.log('Starting to Download Flights Sample Data');
    await wreck.post('http://localhost:5601/api/sample_data/flights', {
      payload: {},
      rejectUnauthorized: false,
      headers: {
        'Content-Type': 'application/json',
        authorization: ADMIN_CREDENTIALS,
        security_tenant: 'global',
      },
    });
    console.log('Downloaded Sample Data');
    const getConfigResponse = await wreck.get(
      'https://localhost:9200/_plugins/_security/api/securityconfig',
      {
        rejectUnauthorized: false,
        headers: {
          authorization: ADMIN_CREDENTIALS,
        },
      }
    );
    const responseBody = (getConfigResponse.payload as Buffer).toString();
    config = JSON.parse(responseBody).config;
    const jwtConfig = {
      http_enabled: true,
      transport_enabled: false,
      order: 5,
      http_authenticator: {
        challenge: true,
        type: 'jwt',
        config: {
          signing_key: signingKey,
          jwt_header: 'Authorization',
          jwt_url_parameter: 'token',
          subject_key: 'sub',
          roles_key: 'roles',
        },
      },
      authentication_backend: {
        type: 'noop',
        config: {},
      },
    };
    try {
      config.dynamic!.authc!.jwt_auth_domain = jwtConfig;
      config.dynamic!.authc!.basic_internal_auth_domain.http_authenticator.challenge = false;
      config.dynamic!.http!.anonymous_auth_enabled = false;
      await wreck.put('https://localhost:9200/_plugins/_security/api/securityconfig/config', {
        payload: config,
        rejectUnauthorized: false,
        headers: {
          'Content-Type': 'application/json',
          authorization: ADMIN_CREDENTIALS,
        },
      });
    } catch (error) {
      console.log('Got an error while updating security config!!', error.stack);
      fail(error);
    }
  });

  afterAll(async () => {
    console.log('Remove the Sample Data');
    await wreck
      .delete('http://localhost:5601/api/sample_data/flights', {
        rejectUnauthorized: false,
        headers: {
          'Content-Type': 'application/json',
          authorization: ADMIN_CREDENTIALS,
        },
      })
      .then((value) => {
        Promise.resolve(value);
      })
      .catch((value) => {
        Promise.resolve(value);
      });
    console.log('Remove the Role Mapping');
    await wreck
      .patch('https://localhost:9200/_plugins/_security/api/rolesmapping/all_access', {
        payload: [
          {
            op: 'remove',
            path: '/users',
            users: ['jwt_test'],
          },
        ],
        rejectUnauthorized: false,
        headers: {
          'Content-Type': 'application/json',
          authorization: ADMIN_CREDENTIALS,
        },
      })
      .then((value) => {
        Promise.resolve(value);
      })
      .catch((value) => {
        Promise.resolve(value);
      });
    console.log('Remove the Security Config');
    await wreck
      .patch('https://localhost:9200/_plugins/_security/api/securityconfig', {
        payload: [
          {
            op: 'remove',
            path: '/config/dynamic/authc/jwt_auth_domain',
          },
        ],
        rejectUnauthorized: false,
        headers: {
          'Content-Type': 'application/json',
          authorization: ADMIN_CREDENTIALS,
        },
      })
      .then((value) => {
        Promise.resolve(value);
      })
      .catch((value) => {
        Promise.resolve(value);
      });
    // shutdown OpenSearchDashboards server
    await root.shutdown();
  });

  it('Login to app/opensearch_dashboards_overview#/ when JWT is enabled', async () => {
    const payload = {
      sub: 'jwt_test',
      roles: 'admin,kibanauser',
    };

    const key = new TextEncoder().encode(rawKey);

    const token = await new SignJWT(payload) // details to  encode in the token
      .setProtectedHeader({ alg: 'HS256' }) // algorithm
      .setIssuedAt()
      .sign(key);
    const driver = getDriver(browser, options).build();
    await driver.get(`http://localhost:5601/app/opensearch_dashboards_overview?token=${token}`);
    await driver.wait(until.elementsLocated(By.xpath(pageTitleXPath)), 10000);

    const cookie = await driver.manage().getCookies();
    expect(cookie.length).toEqual(1);
    await driver.manage().deleteAllCookies();
    await driver.quit();
  });

  it('Login to app/dev_tools#/console when JWT is enabled', async () => {
    const payload = {
      sub: 'jwt_test',
      roles: 'admin,kibanauser',
    };

    const key = new TextEncoder().encode(rawKey);

    const token = await new SignJWT(payload) // details to  encode in the token
      .setProtectedHeader({ alg: 'HS256' }) // algorithm
      .setIssuedAt()
      .sign(key);
    const driver = getDriver(browser, options).build();
    await driver.get(`http://localhost:5601/app/dev_tools?token=${token}`);

    await driver.wait(
      until.elementsLocated(By.xpath('//*[@data-test-subj="sendRequestButton"]')),
      10000
    );

    const cookie = await driver.manage().getCookies();
    expect(cookie.length).toEqual(1);
    await driver.manage().deleteAllCookies();
    await driver.quit();
  });

  it('Login to app/opensearch_dashboards_overview#/ when JWT is enabled with invalid token', async () => {
    const payload = {
      sub: 'jwt_test',
      roles: 'admin,kibanauser',
    };

    const key = new TextEncoder().encode('wrongKey');

    const token = await new SignJWT(payload) // details to  encode in the token
      .setProtectedHeader({ alg: 'HS256' }) // algorithm
      .setIssuedAt()
      .sign(key);
    const driver = getDriver(browser, options).build();
    await driver.get(`http://localhost:5601/app/opensearch_dashboards_overview?token=${token}`);

    const rep = await driver.getPageSource();
    expect(rep).toContain('401');
    expect(rep).toContain('Unauthorized');
    expect(rep).toContain('Authentication Exception');

    const cookie = await driver.manage().getCookies();
    expect(cookie.length).toEqual(0);

    await driver.manage().deleteAllCookies();
    await driver.quit();
  });

  it('Login to app/dev_tools#/console when JWT is enabled with invalid token', async () => {
    const payload = {
      sub: 'jwt_test',
      roles: 'admin,kibanauser',
    };

    const key = new TextEncoder().encode('wrongKey');

    const token = await new SignJWT(payload) // details to  encode in the token
      .setProtectedHeader({ alg: 'HS256' }) // algorithm
      .setIssuedAt()
      .sign(key);
    const driver = getDriver(browser, options).build();
    await driver.get(`http://localhost:5601/app/dev_tools?token=${token}`);

    const rep = await driver.getPageSource();
    expect(rep).toContain('401');
    expect(rep).toContain('Unauthorized');
    expect(rep).toContain('Authentication Exception');

    const cookie = await driver.manage().getCookies();
    expect(cookie.length).toEqual(0);

    await driver.manage().deleteAllCookies();
    await driver.quit();
  });
});

function getDriver(browser: string, options: Options) {
  return new Builder().forBrowser(browser).setFirefoxOptions(options);
}
