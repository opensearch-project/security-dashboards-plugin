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
  OPENSEARCH_DASHBOARDS_SERVER_USER,
  OPENSEARCH_DASHBOARDS_SERVER_PASSWORD,
  ADMIN_USER,
  PROXY_USER,
  PROXY_ROLE,
  PROXY_ADMIN_ROLE,
  AUTHORIZATION_HEADER_NAME, ADMIN_CREDENTIALS,
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
        opensearch: {
          hosts: ['https://localhost:9200'],
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
            type: 'proxy',
          },
          proxycache: {
            user_header: 'x-proxy-user',
            roles_header: 'x-proxy-roles',
          },
        },
      },
      {
        // to make ignoreVersionMismatch setting work
        // can be removed when we have corresponding ES version
        dev: true,
      }
    );
    await root.setup();
    await root.start();


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
      config.dynamic!.http!.xff!.enabled = true;
      config.dynamic!.http!.xff!.internalProxies = '.*';
      config.dynamic!.http!.xff!.remoteIpHeader = 'x-forwarded-for';
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
    // shutdown OpenSearchDashboards server
    await root.shutdown();
  });

  it('can access home page with proxy header', async () => {
    const response = await osdTestServer.request
      .get(root, '/api/status')
      .unset(AUTHORIZATION_HEADER_NAME)
      .set(PROXY_USER, ADMIN_USER)
      .set(PROXY_ROLE, PROXY_ADMIN_ROLE);
    expect(response.status).toEqual(200);
  });

  it('cannot access home page without proxy header', async () => {
    const response = await osdTestServer.request.get(root, '/api/status');
    expect(response.status).toEqual(401);
  });

  it('cannot access home page with partial proxy header', async () => {
    const response = await osdTestServer.request
      .get(root, '/api/status')
      .unset(AUTHORIZATION_HEADER_NAME)
      .set(PROXY_USER, ADMIN_USER);
    expect(response.status).toEqual(401);
  });

  it('cannot access home page with partial proxy header2', async () => {
    const response = await osdTestServer.request
      .get(root, '/api/status')
      .unset(AUTHORIZATION_HEADER_NAME)
      .set(PROXY_ROLE, PROXY_ADMIN_ROLE);
    expect(response.status).toEqual(401);
  });
});
