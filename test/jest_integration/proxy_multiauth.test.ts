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
import { describe, it, beforeAll, afterAll } from '@jest/globals';
import {
  ADMIN_CREDENTIALS,
  OPENSEARCH_DASHBOARDS_SERVER_USER,
  OPENSEARCH_DASHBOARDS_SERVER_PASSWORD,
  ADMIN_USER,
  PROXY_ADMIN_ROLE,
} from '../constant';
import wreck from '@hapi/wreck';

describe('start OpenSearch Dashboards server', () => {
  let root: Root;
  let config;

  beforeAll(async () => {
    root = osdTestServer.createRootWithSettings(
      {
        plugins: {
          scanDirs: [resolve(__dirname, '../..')],
        },
        home: { disableWelcomeScreen: true },
        server: {
          host: 'localhost',
          port: 5601,
        },
        logging: {
          silent: true,
          verbose: false,
        },
        opensearch: {
          hosts: ['https://[::1]:9200'],
          ignoreVersionMismatch: true,
          ssl: { verificationMode: 'none' },
          username: OPENSEARCH_DASHBOARDS_SERVER_USER,
          password: OPENSEARCH_DASHBOARDS_SERVER_PASSWORD,
          requestHeadersAllowlist: [
            'securitytenant',
            'Authorization',
            'x-forwarded-for',
            'x-proxy-user',
            'x-proxy-roles',
          ],
        },
        opensearch_security: {
          auth: {
            anonymous_auth_enabled: false,
            type: ['basicauth', 'proxy'],
            multiple_auth_enabled: true,
          },
          proxycache: {
            user_header: 'x-proxy-user',
            roles_header: 'x-proxy-roles',
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
    const proxyConfig = {
      http_enabled: true,
      transport_enabled: true,
      order: 0,
      http_authenticator: {
        challenge: false,
        type: 'proxy',
        config: {
          user_header: 'x-proxy-user',
          roles_header: 'x-proxy-roles',
        },
      },
      authentication_backend: {
        type: 'noop',
        config: {},
      },
    };
    try {
      config.dynamic!.authc!.proxy_auth_domain = proxyConfig;
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
    console.log('Remove the Security Config');
    await wreck
      .patch('https://localhost:9200/_plugins/_security/api/securityconfig', {
        payload: [
          {
            op: 'remove',
            path: '/config/dynamic/authc/proxy_auth_domain',
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

  it('Verify Proxy access to dashboards', async () => {
    console.log('Wreck access home page');
    await wreck
      .get('http://localhost:5601/app/home#', {
        rejectUnauthorized: true,
        headers: {
          'Content-Type': 'application/json',
          PROXY_USER: ADMIN_USER,
          PROXY_ROLE: PROXY_ADMIN_ROLE,
        },
      })
      .then((value) => {
        Promise.resolve(value);
      })
      .catch((value) => {
        Promise.resolve(value);
      });
  });
});
