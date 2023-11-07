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
import { Builder, By, until } from 'selenium-webdriver';
import { Options } from 'selenium-webdriver/firefox';

describe('start OpenSearch Dashboards server', () => {
  let root: Root;
  let config;

  // XPath Constants
  const userIconBtnXPath = '//button[@id="user-icon-btn"]';
  const signInBtnXPath = '//*[@id="btn-sign-in"]';
  const skipWelcomeBtnXPath = '//button[@data-test-subj="skipWelcomeScreen"]';
  const tenantNameLabelXPath = '//*[@id="tenantName"]';
  const pageTitleXPath = '//*[@id="osdOverviewPageHeader__title"]';
  const tenantSwitchBtnXPath = '//button[@data-test-subj="switch-tenants"]';
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
            type: 'saml',
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
    const samlConfig = {
      http_enabled: true,
      transport_enabled: false,
      order: 5,
      http_authenticator: {
        challenge: true,
        type: 'saml',
        config: {
          idp: {
            metadata_url: 'http://localhost:7000/metadata',
            entity_id: 'urn:example:idp',
          },
          sp: {
            entity_id: 'https://localhost:9200',
          },
          kibana_url: 'http://localhost:5601',
          exchange_key: '6aff3042-1327-4f3d-82f0-40a157ac4464',
        },
      },
      authentication_backend: {
        type: 'noop',
        config: {},
      },
    };
    try {
      config.dynamic!.authc!.saml_auth_domain = samlConfig;
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

  it('Login to app/opensearch_dashboards_overview#/ when SAML is enabled', async () => {
    const driver = getDriver(browser, options).build();
    await driver.get('http://localhost:5601/app/opensearch_dashboards_overview#/');
    await driver.findElement(By.id('btn-sign-in')).click();
    await driver.wait(until.elementsLocated(By.xpath(pageTitleXPath)), 10000);

    const cookie = await driver.manage().getCookies();
    expect(cookie.length).toEqual(3);
    await driver.manage().deleteAllCookies();
    await driver.quit();
  });

  it('Login to app/dev_tools#/console when SAML is enabled', async () => {
    const driver = getDriver(browser, options).build();
    await driver.get('http://localhost:5601/app/dev_tools#/console');
    await driver.findElement(By.id('btn-sign-in')).click();

    await driver.wait(
      until.elementsLocated(By.xpath('//*[@data-test-subj="sendRequestButton"]')),
      10000
    );

    const cookie = await driver.manage().getCookies();
    expect(cookie.length).toEqual(3);
    await driver.manage().deleteAllCookies();
    await driver.quit();
  });

  it('Login to Dashboard with Hash', async () => {
    const urlWithHash = `http://localhost:5601/app/dashboards#/view/7adfa750-4c81-11e8-b3d7-01146121b73d?_g=(filters:!(),refreshInterval:(pause:!f,value:900000),time:(from:now-24h,to:now))&_a=(description:'Analyze%20mock%20flight%20data%20for%20OpenSearch-Air,%20Logstash%20Airways,%20OpenSearch%20Dashboards%20Airlines%20and%20BeatsWest',filters:!(),fullScreenMode:!f,options:(hidePanelTitles:!f,useMargins:!t),query:(language:kuery,query:''),timeRestore:!t,title:'%5BFlights%5D%20Global%20Flight%20Dashboard',viewMode:view)`;
    const driver = getDriver(browser, options).build();
    await driver.manage().deleteAllCookies();
    await driver.get(urlWithHash);
    await driver.findElement(By.xpath(signInBtnXPath)).click();
    // TODO Use a better XPath.
    await driver.wait(
      until.elementsLocated(By.xpath('/html/body/div[1]/div/header/div/div[2]')),
      20000
    );
    const windowHash = await driver.getCurrentUrl();
    expect(windowHash).toEqual(urlWithHash);
    const cookie = await driver.manage().getCookies();
    expect(cookie.length).toEqual(3);
    await driver.manage().deleteAllCookies();
    await driver.quit();
  });

  it.skip('Tenancy persisted after Logout in SAML', async () => {
    const driver = getDriver(browser, options).build();

    await driver.get('http://localhost:5601/app/opensearch_dashboards_overview#/');

    await driver.findElement(By.xpath(signInBtnXPath)).click();

    await driver.wait(until.elementsLocated(By.xpath(pageTitleXPath)), 10000);

    await driver.wait(
      until.elementsLocated(By.xpath('//button[@aria-label="Closes this modal window"]')),
      10000
    );

    // Select Global Tenant Radio Button
    const radio = await driver.findElement(By.xpath('//input[@id="global"]'));
    await driver.executeScript('arguments[0].scrollIntoView(true);', radio);
    await driver.executeScript('arguments[0].click();', radio);

    await driver.wait(until.elementIsSelected(radio));

    await driver.findElement(By.xpath('//button[@data-test-subj="confirm"]')).click();

    await driver.wait(until.elementsLocated(By.xpath(userIconBtnXPath)), 10000);

    await driver.findElement(By.xpath(userIconBtnXPath)).click();

    await driver.findElement(By.xpath('//*[@data-test-subj="log-out-1"]')).click();

    // RELOGIN AND CHECK TENANT

    await driver.wait(until.elementsLocated(By.xpath(signInBtnXPath)), 10000);

    await driver.findElement(By.xpath(signInBtnXPath)).click();

    await driver.wait(until.elementsLocated(By.xpath(skipWelcomeBtnXPath)), 10000);

    await driver.findElement(By.xpath(skipWelcomeBtnXPath)).click();

    await driver.findElement(By.xpath(userIconBtnXPath)).click();

    await driver.wait(until.elementsLocated(By.xpath(tenantNameLabelXPath)), 10000);

    const tenantName = await driver.findElement(By.xpath(tenantNameLabelXPath)).getText();
    const localStorageItem = await driver.executeScript(
      `return window.localStorage.getItem("opendistro::security::tenant::saved")`
    );

    // Retry previous steps one more time if the webdriver doens't reload as expected
    if (tenantName === 'Private' && localStorageItem === '""') {
      await driver.wait(until.elementsLocated(By.xpath(tenantSwitchBtnXPath)), 10000);
      await driver.findElement(By.xpath(tenantSwitchBtnXPath)).click();

      await driver.executeScript('arguments[0].scrollIntoView(true);', radio);
      await driver.executeScript('arguments[0].click();', radio);
      await driver.wait(until.elementIsSelected(radio));

      await driver.findElement(By.xpath('//button[@data-test-subj="confirm"]')).click();

      await driver.wait(until.elementsLocated(By.xpath(userIconBtnXPath)), 10000);
      await driver.findElement(By.xpath(userIconBtnXPath)).click();
      await driver.findElement(By.xpath('//*[@data-test-subj="log-out-1"]')).click();

      await driver.wait(until.elementsLocated(By.xpath(signInBtnXPath)), 10000);
      await driver.findElement(By.xpath(signInBtnXPath)).click();

      await driver.wait(until.elementsLocated(By.xpath(userIconBtnXPath)), 10000);
      await driver.findElement(By.xpath(userIconBtnXPath)).click();
      await driver.wait(until.elementsLocated(By.xpath(tenantNameLabelXPath)), 10000);

      const newtenantName = await driver.findElement(By.xpath(tenantNameLabelXPath)).getText();
      expect(newtenantName).toEqual('Global');
    } else {
      expect(localStorageItem).toEqual('""');
      expect(tenantName).toEqual('Global');
    }
    await driver.manage().deleteAllCookies();
    await driver.quit();

    expect(localStorageItem).toEqual('""');
  });
});

function getDriver(browser: string, options: Options) {
  return new Builder().forBrowser(browser).setFirefoxOptions(options);
}
