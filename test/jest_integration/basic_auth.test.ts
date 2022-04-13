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
  AUTHORIZATION_HEADER_NAME,
  ADMIN_USER,
  ADMIN_PASSWORD,
} from '../constant';
import { getAuthCookie, extractAuthCookie } from '../helper/cookie';
import wreck from '@hapi/wreck';

describe('start OpenSearch Dashboards server', () => {
  let root: Root;
  let anonymousDisabledRoot: Root;

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
        },
        opensearch_security: {
          auth: {
            anonymous_auth_enabled: true,
          },
        },
      },
      {
        // to make ignoreVersionMismatch setting work
        // can be removed when we have corresponding ES version
        dev: true,
      }
    );

    anonymousDisabledRoot = osdTestServer.createRootWithSettings(
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
        },
        opensearch_security: {
          auth: {
            anonymous_auth_enabled: false,
          },
        },
      },
      {
        // to make ignoreVersionMismatch setting work
        // can be removed when we have corresponding ES version
        dev: true,
      }
    );
    await anonymousDisabledRoot.setup();
    await anonymousDisabledRoot.start();

    console.log('Starting OpenSearchDashboards server..');
    await root.setup();
    await root.start();
    console.log('Started OpenSearchDashboards server');

    // update ES security config to enable anonymous auth
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
    const config = JSON.parse(responseBody).config;
    try {
      config.dynamic!.http!.anonymous_auth_enabled = true;
      const updateConfigResponse = await wreck.put(
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
      console.log(error);
    }
  });

  afterAll(async () => {
    // shutdown OpenSearchDashboards server
    await root.shutdown();
    await anonymousDisabledRoot.shutdown();
  });

  it('can access login page without credentials', async () => {
    const response = await osdTestServer.request.get(root, '/app/login');
    expect(response.status).toEqual(200);
  });

  it('call authinfo API as admin', async () => {
    const testUserCredentials = Buffer.from(ADMIN_CREDENTIALS);
    const response = await osdTestServer.request
      .get(root, '/api/v1/auth/authinfo')
      .set(AUTHORIZATION_HEADER_NAME, ADMIN_CREDENTIALS);
    expect(response.status).toEqual(200);
  });

  it('call authinfo API without credentials', async () => {
    const response = await osdTestServer.request
      .get(root, '/api/v1/auth/authinfo')
      .unset('Authorization');
    expect(response.status).toEqual(401);
  });

  it('call authinfo API with cookie', async () => {
    const authCookie = await getAuthCookie(root, ADMIN_USER, ADMIN_PASSWORD);

    const response = await osdTestServer.request
      .get(root, '/api/v1/auth/authinfo')
      .unset(AUTHORIZATION_HEADER_NAME)
      .set('Cookie', authCookie);
    expect(response.status).toEqual(200);
  });

  it('login with user name and password', async () => {
    const response = await osdTestServer.request
      .post(root, '/auth/login')
      .unset(AUTHORIZATION_HEADER_NAME)
      .send({
        username: ADMIN_USER,
        password: ADMIN_PASSWORD,
      });
    expect(response.status).toEqual(200);
    const authCookie = extractAuthCookie(response);
    // cookie is like security_authentication=<cookie>, verify there are actual cookie value
    expect(authCookie.split('=')[1]).toBeTruthy();
  });

  it('login fails with invalid credentials', async () => {
    const response = await osdTestServer.request
      .post(root, '/auth/login')
      .unset(AUTHORIZATION_HEADER_NAME)
      .send({
        username: ADMIN_USER,
        password: 'invalid',
      });
    expect(response.status).toEqual(401);
  });

  it('log out', async () => {
    const authCookie = await getAuthCookie(root, ADMIN_USER, ADMIN_PASSWORD);

    const response = await osdTestServer.request
      .post(root, '/auth/logout')
      .unset(AUTHORIZATION_HEADER_NAME)
      .set('Cookie', authCookie);
    expect(response.status).toEqual(200);
    const cookie = extractAuthCookie(response);
    expect(cookie.split('=')[1]).toBeFalsy();
  });

  it('anonymous auth', async () => {
    const response = await osdTestServer.request
      .get(root, '/auth/anonymous')
      .unset(AUTHORIZATION_HEADER_NAME);
    expect(response.status).toEqual(302);
  });

  it('anonymous disabled', async () => {
    const response = await osdTestServer.request
      .get(anonymousDisabledRoot, '/auth/anonymous')
      .unset(AUTHORIZATION_HEADER_NAME);

    expect(response.status).toEqual(302);
  });

  it('enforce authentication on api/status route', async () => {
    const response = await osdTestServer.request.get(root, '/api/status');
    expect(response.status).toEqual(401);
  });

  it('can access api/status route with admin credential', async () => {
    const response = await osdTestServer.request
      .get(root, '/api/status')
      .set(AUTHORIZATION_HEADER_NAME, ADMIN_CREDENTIALS);
    expect(response.status).toEqual(200);
  });

  it('redirect for home follows login for anonymous auth enabled', async () => {
    const response = await osdTestServer.request
      .get(root, '/app/home#/')
      .unset(AUTHORIZATION_HEADER_NAME);

    expect(response.status).toEqual(302);
    expect(response.header.location).toEqual('/auth/anonymous?nextUrl=%2Fapp%2Fhome');

    const response2 = await osdTestServer.request.get(root, response.header.location);

    expect(response2.status).toEqual(302);
    expect(response2.header.location).toEqual('/app/login?nextUrl=%2Fapp%2Fhome');

    const response3 = await osdTestServer.request.get(root, response2.header.location);

    expect(response3.status).toEqual(200);
  });

  it('redirect for home follows login for anonymous auth disabled', async () => {
    const response = await osdTestServer.request
      .get(anonymousDisabledRoot, '/app/home#/')
      .unset(AUTHORIZATION_HEADER_NAME);

    expect(response.status).toEqual(302);
    expect(response.header.location).toEqual('/app/login?nextUrl=%2Fapp%2Fhome');

    const response2 = await osdTestServer.request.get(
      anonymousDisabledRoot,
      response.header.location
    );

    // should hit login page and should not allow it to login becasue anonymouse auth is disabled
    expect(response2.status).toEqual(200);
  });

  it('redirects to an object ignores after hash with anonymous auth enabled', async () => {
    const startingPath = `/app/dashboards#/view/edf84fe0-e1a0-11e7-b6d5-4dc382ef7f5b`;
    const expectedPath = `/app/login?nextUrl=%2Fapp%2Fdashboards`;

    const response = await osdTestServer.request
      .get(root, startingPath)
      .unset(AUTHORIZATION_HEADER_NAME);

    expect(response.status).toEqual(302);

    const response2 = await osdTestServer.request.get(root, response.header.location);

    expect(response2.status).toEqual(302);
    expect(response2.header.location).toEqual(expectedPath);

    const response3 = await osdTestServer.request.get(root, response2.header.location);

    expect(response3.status).toEqual(200);
  });
});
