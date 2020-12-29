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
  KIBANA_SERVER_USER,
  KIBANA_SERVER_PASSWORD,
  ADMIN_USER,
  ADMIN_PASSWORD,
  AUTHORIZATION_HEADER_NAME,
} from '../constant';
import { extractAuthCookie, getAuthCookie } from '../helper/cookie';
import { createOrUpdateEntityAsAdmin } from '../helper/entity_operation';

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
          multitenancy: { enabled: true, tenants: { preferred: ['Private', 'Global'] } },
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
    await root.shutdown();
  });

  async function createTestUser(username: string = undefined, password: string = undefined) {
    const testUserName = username || `test_user_${Date.now()}`;
    const testUserPassword = password || 'Test_123';

    await createOrUpdateEntityAsAdmin(root, 'internalusers', testUserName, {
      password: testUserPassword,
    });
    return { username: testUserName, password: testUserPassword };
  }

  async function getTenant(authCookie: string) {
    return await kbnTestServer.request
      .get(root, '/api/v1/multitenancy/tenant')
      .unset(AUTHORIZATION_HEADER_NAME)
      .set('Cookie', authCookie);
  }

  it('has access to tenant', async () => {
    const { username, password } = await createTestUser();
    const authCookie = await getAuthCookie(root, username, password);
    const getTenantResponse = await getTenant(authCookie);
    expect(getTenantResponse.status).toEqual(200);
  });

  it('change tenant', async () => {
    const { username, password } = await createTestUser();
    await createOrUpdateEntityAsAdmin(root, 'internalusers', username, {
      password,
    });

    let authCookie = await getAuthCookie(root, username, password);
    const usePrivateTenantResponse = await kbnTestServer.request
      .post(root, '/api/v1/multitenancy/tenant')
      .unset(AUTHORIZATION_HEADER_NAME)
      .set('Cookie', authCookie)
      .send({
        username,
        tenant: '__user__',
      });
    expect(usePrivateTenantResponse.status).toEqual(200);
    expect(usePrivateTenantResponse.text).toEqual('__user__');

    authCookie = extractAuthCookie(usePrivateTenantResponse);
    let getTenantResponse = await getTenant(authCookie);
    expect(getTenantResponse.status).toEqual(200);
    expect(getTenantResponse.text).toEqual('__user__');

    authCookie = extractAuthCookie(getTenantResponse);
    const useGlobalTenantResponse = await kbnTestServer.request
      .post(root, '/api/v1/multitenancy/tenant')
      .unset(AUTHORIZATION_HEADER_NAME)
      .set('Cookie', authCookie)
      .send({
        username,
        tenant: '',
      });
    expect(useGlobalTenantResponse.status).toEqual(200);
    expect(useGlobalTenantResponse.text).toEqual('');

    authCookie = extractAuthCookie(useGlobalTenantResponse);
    getTenantResponse = await getTenant(authCookie);
    expect(getTenantResponse.status).toEqual(200);
    expect(getTenantResponse.text).toEqual('');
  });

  it('call multitenancy info API as admin', async () => {
    const authCookie = await getAuthCookie(root, ADMIN_USER, ADMIN_PASSWORD);
    const multitenancyInfoResponse = await kbnTestServer.request
      .get(root, '/api/v1/multitenancy/info')
      .unset(AUTHORIZATION_HEADER_NAME)
      .set('Cookie', authCookie);
    expect(multitenancyInfoResponse.status).toEqual(200);
    expect(multitenancyInfoResponse.body.user_name).toEqual(ADMIN_USER);
  });

  it('call multitenancy info API as common user', async () => {
    const { username, password } = await createTestUser();

    const authCookie = await getAuthCookie(root, username, password);
    const multitenancyInfoResponse = await kbnTestServer.request
      .get(root, '/api/v1/multitenancy/info')
      .unset(AUTHORIZATION_HEADER_NAME)
      .set('Cookie', authCookie);
    expect(multitenancyInfoResponse.status).toEqual(200);
    expect(multitenancyInfoResponse.body.user_name).toEqual(username);
  });
});
