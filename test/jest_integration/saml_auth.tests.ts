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
import { Builder, By, until, ThenableWebDriver } from 'selenium-webdriver';


describe('start OpenSearch Dashboards server', () => {
  let root: Root;
  let driver: ThenableWebDriver;
  let config;

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

    console.log('Starting the Selenium Web Driver');
    driver = new Builder().forBrowser('firefox').build();

    await wreck.patch(
      'https://localhost:9200/_plugins/_security/api/rolesmapping/all_access',
      {
        payload: [{
          "op": "add",
          "path": "/users",
          "value": ["saml.jackson@example.com"]
        }],
        rejectUnauthorized: false,
        headers: {
          'Content-Type': 'application/json',
          authorization: ADMIN_CREDENTIALS,
        },
      }
    );
    console.log("Starting to Download Flights Sample Data");
    await wreck.post(
      'http://localhost:5601/api/sample_data/flights',
      {
        payload: {},
        rejectUnauthorized: false,
        headers: {
          'Content-Type': 'application/json',
          authorization: ADMIN_CREDENTIALS,
        },
      }
    );
    console.log("Downloaded Sample Data");
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
    const saml_config = {
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
      config.dynamic!.authc!.saml_auth_domain = saml_config;
      await wreck.put(
        'https://localhost:9200/_plugins/_security/api/securityconfig/config',
        {
          payload: config,
          rejectUnauthorized: false,
          headers: {
            'Content-Type': 'application/json',
            authorization: ADMIN_CREDENTIALS,
          },
        }
      );
    } catch (error) {
      console.log('Got an error!!');
    }
    console.log('The Config Response is : ' + JSON.stringify(config));
  });

  afterAll( async () => {
    console.log("Remove the Sample Data");
    await wreck.delete(
      'http://localhost:5601/api/sample_data/flights',
      {
        rejectUnauthorized: false,
        headers: {
          'Content-Type': 'application/json',
          authorization: ADMIN_CREDENTIALS,
        },
      }
    ).then(value => {
      Promise.resolve(value);
    }).catch(value => {
      Promise.resolve(value);
    });
    console.log("Remove the Role Mapping");
    await wreck.patch(
      'https://localhost:9200/_plugins/_security/api/rolesmapping/all_access',
      {
        payload: [{
          "op": "remove",
          "path": "/users",
          "users": ["saml.jackson@example.com"]
        }],
        rejectUnauthorized: false,
        headers: {
          'Content-Type': 'application/json',
          authorization: ADMIN_CREDENTIALS,
        },
      }
    ).then(value => {
      Promise.resolve(value);
    }).catch(value => {
      Promise.resolve(value);
    });
    console.log("Remove the Security Config");
     await wreck.patch(
      'https://localhost:9200/_plugins/_security/api/securityconfig',
      {
        payload: [{
          "op": "remove",
          "path": "/config/dynamic/authc/saml_auth_domain",
        }],
        rejectUnauthorized: false,
        headers: {
          'Content-Type': 'application/json',
          authorization: ADMIN_CREDENTIALS,
        },
      }
    ).then(value => {
       Promise.resolve(value);
     }).catch(value => {
       Promise.resolve(value);
     });
     //   .then(value => {
     //
     // }).catch(reason => {
     //
     // });
    // shutdown OpenSearchDashboards server
    await root.shutdown();
    await driver.quit();

  });
  // 1 Integ Test for first time log in.
  // 1 Integ Test for Log into Dashboard with Hash
  // 1 Integ Test for logging into dev console
  // 1 Integ Test to test Cookie expiry
  it('Login to app/opensearch_dashboards_overview#/ when SAML is enabled', async () => {
    await driver.get('http://localhost:5601/app/opensearch_dashboards_overview#/');
    await driver.findElement(By.id('btn-sign-in')).click();
    // await driver.wait(until.urlContains('/app/home'));
    // await driver.wait(until.titleIs('Home - OpenSearch Dashboards'));
    // let currUrl = await driver.getCurrentUrl();
    // console.log(currUrl);

    await driver
      .wait(
        until.elementsLocated(
          By.xpath("//*[@id=\"osdOverviewPageHeader__title\"]")
        ),
        10000
      );

    let cookie = await driver.manage().getCookies();
    console.log(cookie.length);
    console.log(cookie[1]);
    expect(cookie.length).toEqual(2);
    await driver.manage().deleteAllCookies();
  });

  it('Login to app/dev_tools#/console when SAML is enabled', async () => {
    await driver.get('http://localhost:5601/app/dev_tools#/console');
    await driver.findElement(By.id('btn-sign-in')).click();

    await driver
      .wait(
        until.elementsLocated(
          By.xpath("/html/body/div[1]/div/div/div/div[2]/div/main/div[1]/span/button/span")
        ),
        10000
      );

    let cookie = await driver.manage().getCookies();
    expect(cookie.length).toEqual(2);
    await driver.manage().deleteAllCookies();
  });

});

function sleepFor(sleepDuration: number) {
  let now = new Date().getTime();
  while (new Date().getTime() < now + sleepDuration) {
    /* Do nothing */
  }
}
