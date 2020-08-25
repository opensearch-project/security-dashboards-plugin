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

import * as kbnTestServer from '../../../../src/test_utils/kbn_server';
import { Root } from '../../../../src/core/server/root';
import { resolve } from 'path';
import { describe, expect, it, beforeAll, afterAll } from '@jest/globals';
import { startElasticsearch, stopElasticsearch } from '../es/elasticsearch_helper';
import { ChildProcess } from 'child_process';
import {
  ADMIN_CREDENTIALS,
  KIBANA_SERVER_USER,
  KIBANA_SERVER_PASSWORD,
  AUTHORIZATION_HEADER_NAME,
  ADMIN_USER,
  ADMIN_PASSWORD,
} from '../constant';
import { getAuthCookie, extractAuthCookie } from '../helper/cookie';

describe('start kibana server', () => {
  let root: Root;
  let esProcess: ChildProcess;

  beforeAll(async () => {
    esProcess = await startElasticsearch();
    console.log('Started Elasticsearch');

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
  });

  afterAll(async () => {
    // shutdown Kibana server
    root.shutdown();
    // shutdown Elasticsearch
    await stopElasticsearch(esProcess);
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
});
