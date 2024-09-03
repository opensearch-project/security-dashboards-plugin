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
  JWT_ADMIN_ROLE,
} from '../constant';
import wreck from '@hapi/wreck';
import { SignJWT } from 'jose';

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
          hosts: ['https://localhost:9200'],
          ignoreVersionMismatch: true,
          ssl: { verificationMode: 'none' },
          username: OPENSEARCH_DASHBOARDS_SERVER_USER,
          password: OPENSEARCH_DASHBOARDS_SERVER_PASSWORD,
          requestHeadersAllowlist: ['securitytenant', 'Authorization'],
        },
        opensearch_security: {
          auth: {
            anonymous_auth_enabled: false,
            type: ['basicauth', 'jwt'],
            multiple_auth_enabled: true,
          },
          jwt: {
            url_param: 'token',
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
    const jwtConfig = {
      http_enabled: true,
      transport_enabled: true,
      order: 0,
      http_authenticator: {
        challenge: false,
        type: 'jwt',
        config: {
          signing_key: 'OTkwMTFkZjZlZjQwZTRhMmNkOWNkNmNjYjJkNjQ5ZTAK',
          jwt_header: 'Authorization',
          jwt_url_parameter: 'token',
          jwt_clock_skew_tolerance_seconds: 30,
          roles_key: 'roles',
          subject_key: 'sub',
        },
      },
      authentication_backend: {
        type: 'noop',
        config: {},
      },
    };
    try {
      config.dynamic!.authc!.jwt_auth_domain = jwtConfig;
      config.dynamic!.authc!.basic_internal_auth_domain.http_authenticator.challenge = true;
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
      console.log('Got an error while updating security config!', error.stack);
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

  it('Verify JWT access to dashboards', async () => {
    console.log('Wreck access home page');
    const adminJWT = await new SignJWT({
      roles: [JWT_ADMIN_ROLE],
      sub: ADMIN_USER,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .sign(new TextEncoder().encode('99011df6ef40e4a2cd9cd6ccb2d649e0'));
    console.log(adminJWT);
    await wreck
      .get(`http://localhost:5601/app/home?token=${adminJWT}#`, {
        rejectUnauthorized: true,
        headers: {
          'Content-Type': 'application/json',
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
