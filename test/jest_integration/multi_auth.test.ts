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
import {
  ADMIN_CREDENTIALS,
  OPENSEARCH_DASHBOARDS_SERVER_USER,
  OPENSEARCH_DASHBOARDS_SERVER_PASSWORD,
} from '../constant';
import wreck from '@hapi/wreck';
import { Builder, By, until, WebElement } from 'selenium-webdriver';
import { Options } from 'selenium-webdriver/firefox';

describe('start OpenSearch Dashboards server', () => {
  let root: Root;
  let config;

  // XPath Constants
  const usernameXPath = '//input[@id="user-icon-btn"]';
  const passwordXPath = '//input[@id="user-icon-btn"]';
  const loginXPath = '//button[@aria-label="basicauth_login_button"]';
  const oidcXPath = '//button[@aria-label="openid_login_button"]';
  const idpLoginXPath = '//input[@value="Sign in"]';
  const samlXPath = '//button[@aria-label="saml_login_button"]';

  const userIconBtnXPath = '//button[@id="user-icon-btn"]';
  const signInBtnXPath = '//*[@id="btn-sign-in"]';
  const skipWelcomeBtnXPath = '//button[@data-test-subj="skipWelcomeScreen"]';
  const tenantNameLabelXPath = '//*[@id="tenantName"]';
  const pageTitleXPath = '//*[@id="osdOverviewPageHeader__title"]';
  // Browser Settings
  const browser = 'firefox';
  const options = new Options().headless();

  beforeAll(async () => {
    root = osdTestServer.createRootWithSettings(
      {
        plugins: {
          scanDirs: [resolve(__dirname, '../..')],
        },
        server: {
          host: 'localhost',
          port: 5601,
          xsrf: {
            whitelist: [
              '/_opendistro/_security/saml/acs/idpinitiated',
              '/_opendistro/_security/saml/acs',
              '/_opendistro/_security/saml/logout',
            ],
          },
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
            //type: ['basicauth','openid','saml'],
            type: 'openid',
          },
          openid:{
            connect_url: 'https://dev-16628832.okta.com/.well-known/openid-configuration',
            client_id: '0oa566po99gotj46m5d7',
            client_secret: '4Gy9_NxFS2Xf97t4GRzkoRlyRAsApRwFcM6Zx9WB',
            scope: 'openid profile email',
          },
          multitenancy: {
            enabled: true,
            tenants: {
              enable_global: true,
              enable_private: true,
              preferred: ['Private', 'Global'],
            },
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
          value: ['saml.jackson@example.com'],
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
    const backendConfig = {
        basic_internal_auth_domain: {
            http_enabled: true,
            transport_enabled: true,
            order: 0,
            http_authenticator: {
                challenge: false,
                type: 'basic',
            },
            authentication_backend: {
                type: 'internal',
            },
        },
        openid_auth_domain:{
            http_enabled: true,
            transport_enabled: false,
            order: 1,
            http_authenticator: {
              challenge: false,
              type: 'openid',
              config: {
                subject_key: 'email',
                roles_key: 'email',
                openid_connect_url: 'https://dev-16628832.okta.com/.well-known/openid-configuration',
              },
            },
            authentication_backend: {
              type: 'noop',
              config: {},
            },
        },
        saml_auth_domain:{
            http_enabled: true,
            transport_enabled: false,
            order: 5,
            http_authenticator: {
              challenge: true,
              type: 'saml',
              config: {
                idp: {
                  metadata_url: 'https://dev-16628832.okta.com/app/exk5f11x4b7dF6BF55d7/sso/saml/metadata',
                  entity_id: 'http://www.okta.com/exk5klfc1bNZoSnIs5d7',
                },
                sp: {
                  entity_id: 'opensearch_dashboard_saml_os',
                },
                kibana_url: 'http://localhost:5601',
                exchange_key: '6aff3042-1327-4f3d-82f0-40a157ac4464',
              },
            },
            authentication_backend: {
              type: 'noop',
              config: {},
            },
        }
    };
    try {
        config.dynamic!.authc!.saml_auth_domain = backendConfig.saml_auth_domain;
        config.dynamic!.authc!.openid_auth_domain = backendConfig.openid_auth_domain;
        config.dynamic!.authc!.basic_internal_auth_domain = backendConfig.basic_internal_auth_domain;
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
            users: ['saml.jackson@example.com'],
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
            path: '/config/dynamic/authc/saml_auth_domain',
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
/*
  it('Login when multiple authentication is enabled:: login with basicauth', async () => {
    const driver = getDriver(browser, options).build();
    await driver.get('http://localhost:5601');
    const username = driver.findElement(By.xpath(usernameXPath));
    const password = driver.findElement(By.xpath(passwordXPath));
    username.sendKeys("admin");
    password.sendKeys("admin");
    driver.findElement(By.xpath(loginXPath)).click();
    
    const expectedUrl = "http://localhost:5601/app/home#/";
    const actualUrl = driver.getCurrentUrl();
    expect(actualUrl).toEqual(expectedUrl);
    await driver.quit();
  });*/

  it('Login when multiple authentication is enabled:: login with openid', async () => {
    const driver = getDriver(browser, options).build();
    await driver.get('http://localhost:5601');
    driver.findElement(By.xpath(oidcXPath)).click();
    
    //const idpUrl = driver.getCurrentUrl();
    const username = driver.findElement(By.id("input28"));
    const password = driver.findElement(By.id("input36"));
    username.sendKeys("svc.opensearch.auth@gmail.com");
    password.sendKeys("Admin!12345");
    driver.findElement(By.xpath(idpLoginXPath)).click();

    const expectedUrl = "http://localhost:5601/app/home#/";
    const actualUrl = driver.getCurrentUrl();
    expect(actualUrl).toEqual(expectedUrl);
    await driver.quit();
  });
/*
  it('Login when multiple authentication is enabled:: login with saml', async () => {
    const driver = getDriver(browser, options).build();
    await driver.get('http://localhost:5601');
    driver.findElement(By.xpath(samlXPath)).click();
    
    //const idpUrl = driver.getCurrentUrl();
    const username = driver.findElement(By.id("input28"));
    const password = driver.findElement(By.id("input36"));
    username.sendKeys("svc.opensearch.auth@gmail.com");
    password.sendKeys("Admin!12345");
    driver.findElement(By.xpath(idpLoginXPath)).click();

    const expectedUrl = "http://localhost:5601/app/home#/";
    const actualUrl = driver.getCurrentUrl();
    expect(actualUrl).toEqual(expectedUrl);
    await driver.quit();
  });*/
});

function getDriver(browser: string, options: Options) {
  return new Builder().forBrowser(browser).setFirefoxOptions(options);
}
