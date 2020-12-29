/*
 *   Copyright 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
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

import * as kbnTestServer from '../../../../src/core/test_helpers/kbn_server';
import { Root } from '../../../../src/core/server/root';
import { resolve } from 'path';
import { describe, expect, it, beforeAll, afterAll } from '@jest/globals';
import {
  ADMIN_CREDENTIALS,
  KIBANA_SERVER_USER,
  KIBANA_SERVER_PASSWORD,
  AUTHORIZATION_HEADER_NAME,
  ADMIN_USER,
  ADMIN_PASSWORD,
} from '../constant';
import { getAuthCookie, extractAuthCookie } from '../helper/cookie';
import wreck from '@hapi/wreck';

describe('start kibana server', () => {
  let root: Root;

  beforeAll(async () => {
    root = kbnTestServer.createRootWithSettings(
      {
        plugins: {
          scanDirs: [resolve(__dirname, '../..')],
        },
        elasticsearch: {
          hosts: ['https://localhost:9200'],
          ignoreVersionMismatch: true,
          ssl: { verificationMode: 'none' },
          username: KIBANA_SERVER_USER,
          password: KIBANA_SERVER_PASSWORD,
        },
        opendistro_security: {
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

    console.log('Starting Kibana server..');
    await root.setup();
    await root.start();
    console.log('Started Kibana server');

    // update ES security config to enable anonymous auth
    const getConfigResponse = await wreck.get(
      'https://localhost:9200/_opendistro/_security/api/securityconfig',
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
        'https://localhost:9200/_opendistro/_security/api/securityconfig/config',
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
    // shutdown Kibana server
    await root.shutdown();
  });

  it('can access login page without credentials', async () => {
    const response = await kbnTestServer.request.get(root, '/app/login');
    expect(response.status).toEqual(200);
  });

  it('call authinfo API as admin', async () => {
    const testUserCredentials = Buffer.from(ADMIN_CREDENTIALS);
    const response = await kbnTestServer.request
      .get(root, '/api/v1/auth/authinfo')
      .set(AUTHORIZATION_HEADER_NAME, ADMIN_CREDENTIALS);
    expect(response.status).toEqual(200);
  });

  it('call authinfo API without credentials', async () => {
    const response = await kbnTestServer.request
      .get(root, '/api/v1/auth/authinfo')
      .unset('Authorization');
    expect(response.status).toEqual(401);
  });

  it('call authinfo API with cookie', async () => {
    const authCookie = await getAuthCookie(root, ADMIN_USER, ADMIN_PASSWORD);

    const response = await kbnTestServer.request
      .get(root, '/api/v1/auth/authinfo')
      .unset(AUTHORIZATION_HEADER_NAME)
      .set('Cookie', authCookie);
    expect(response.status).toEqual(200);
  });

  it('login with user name and password', async () => {
    const response = await kbnTestServer.request
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
    const response = await kbnTestServer.request
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

    const response = await kbnTestServer.request
      .post(root, '/auth/logout')
      .unset(AUTHORIZATION_HEADER_NAME)
      .set('Cookie', authCookie);
    expect(response.status).toEqual(200);
    const cookie = extractAuthCookie(response);
    expect(cookie.split('=')[1]).toBeFalsy();
  });

  it('anonymous auth', async () => {
    const response = await kbnTestServer.request
      .get(root, '/auth/anonymous')
      .unset(AUTHORIZATION_HEADER_NAME);
    expect(response.status).toEqual(200);
    expect(response.body.username).toEqual('opendistro_security_anonymous');
  });

  it('anonymous disabled', async () => {
    const anonymousDisabledRoot = kbnTestServer.createRootWithSettings(
      {
        plugins: {
          scanDirs: [resolve(__dirname, '../..')],
        },
        elasticsearch: {
          hosts: ['https://localhost:9200'],
          ignoreVersionMismatch: true,
          ssl: { verificationMode: 'none' },
          username: KIBANA_SERVER_USER,
          password: KIBANA_SERVER_PASSWORD,
        },
        opendistro_security: {
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
    const response = await kbnTestServer.request
      .get(anonymousDisabledRoot, '/auth/anonymous')
      .unset(AUTHORIZATION_HEADER_NAME);
    expect(response.status).toEqual(400);
    await anonymousDisabledRoot.shutdown();
  });
});
