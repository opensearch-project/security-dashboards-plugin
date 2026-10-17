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
  ADMIN_PASSWORD,
  ADMIN_CREDENTIALS,
  AUTHORIZATION_HEADER_NAME,
} from '../constant';
import { extractAuthCookie, getAuthCookie } from '../helper/cookie';
import { createOrUpdateEntityAsAdmin } from '../helper/entity_operation';

describe('start OpenSearch Dashboards server', () => {
  let root: Root;

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
          requestHeadersAllowlist: ['authorization', 'securitytenant'],
        },
        opensearch_security: {
          multitenancy: { enabled: true, tenants: { preferred: ['Private', 'Global'] } },
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
    console.log('Started OpenSearchDashboards server');
  });

  afterAll(async () => {
    // shutdown OpenSearchDashboards server
    await root.shutdown();
  });

  async function createTestUser(username: string = undefined, password: string = undefined) {
    const testUserName = username || `test_user_${Date.now()}`;
    const testUserPassword = password || 'testUserPassword123';

    await createOrUpdateEntityAsAdmin(root, 'internalusers', testUserName, {
      password: testUserPassword,
    });
    return { username: testUserName, password: testUserPassword };
  }

  async function getTenant(authCookie: string) {
    return await osdTestServer.request
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
    const usePrivateTenantResponse = await osdTestServer.request
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
    const useGlobalTenantResponse = await osdTestServer.request
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
    const multitenancyInfoResponse = await osdTestServer.request
      .get(root, '/api/v1/multitenancy/info')
      .unset(AUTHORIZATION_HEADER_NAME)
      .set('Cookie', authCookie);
    expect(multitenancyInfoResponse.status).toEqual(200);
    expect(multitenancyInfoResponse.body.user_name).toEqual(ADMIN_USER);
  });

  it('call multitenancy info API as common user', async () => {
    const { username, password } = await createTestUser();

    const authCookie = await getAuthCookie(root, username, password);
    const multitenancyInfoResponse = await osdTestServer.request
      .get(root, '/api/v1/multitenancy/info')
      .unset(AUTHORIZATION_HEADER_NAME)
      .set('Cookie', authCookie);
    expect(multitenancyInfoResponse.status).toEqual(200);
    expect(multitenancyInfoResponse.body.user_name).toEqual(username);
  });

  it.each<[string, string | undefined, number, number]>([
    ['base_dashboards_user', 'kibana_all_write', 200, 200],
    ['base_dashboards_user_read_only', 'kibana_all_read', 200, 403],
    ['base_dashboards_user', undefined, 403, 403],
    ['base_dashboards_user_read_only', undefined, 403, 403],
  ])(
    '%s with tenant permission %s: saved-object read %s, write %s',
    async (baseRole, tenantPermission, readStatus, writeStatus) => {
      const name = `base_role_${Date.now()}`;
      const password = 'testUserPassword123!';
      const roles = tenantPermission ? [baseRole, name] : [baseRole];
      const credentials = `Basic ${Buffer.from(`${name}:${password}`).toString('base64')}`;
      // Use a core saved-object type so this test does not depend on the data plugin.
      const objectPath = `/api/saved_objects/config/${name}`;

      try {
        const tenant = await createOrUpdateEntityAsAdmin(root, 'tenants', name, {
          description: 'Base Dashboards role integration test',
        });
        expect(tenant.status).toEqual(200);
        if (tenantPermission) {
          const role = await createOrUpdateEntityAsAdmin(root, 'roles', name, {
            cluster_permissions: [],
            index_permissions: [],
            tenant_permissions: [{ tenant_patterns: [name], allowed_actions: [tenantPermission] }],
          });
          expect(role.status).toEqual(200);
        }
        const user = await createOrUpdateEntityAsAdmin(root, 'internalusers', name, {
          password,
          opendistro_security_roles: roles,
        });
        expect(user.status).toEqual(200);
        const authInfo = await osdTestServer.request
          .get(root, '/api/v1/auth/authinfo')
          .set(AUTHORIZATION_HEADER_NAME, credentials);
        expect(authInfo.status).toEqual(200);
        expect(authInfo.body.roles.sort()).toEqual([...roles].sort());

        const seed = await osdTestServer.request
          .post(root, objectPath)
          .set(AUTHORIZATION_HEADER_NAME, ADMIN_CREDENTIALS)
          .set('securitytenant', name)
          .send({ attributes: { defaultIndex: 'base-role-original' } });
        expect(seed.status).toEqual(200);

        const read = await osdTestServer.request
          .get(root, objectPath)
          .set(AUTHORIZATION_HEADER_NAME, credentials)
          .set('securitytenant', name);
        expect(read.status).toEqual(readStatus);
        if (readStatus === 200) {
          expect(read.body.attributes.defaultIndex).toEqual('base-role-original');
        }
        const write = await osdTestServer.request
          .put(root, objectPath)
          .set(AUTHORIZATION_HEADER_NAME, credentials)
          .set('securitytenant', name)
          .send({ attributes: { defaultIndex: 'base-role-updated' } });
        expect(write.status).toEqual(writeStatus);

        const stored = await osdTestServer.request
          .get(root, objectPath)
          .set(AUTHORIZATION_HEADER_NAME, ADMIN_CREDENTIALS)
          .set('securitytenant', name);
        expect(stored.status).toEqual(200);
        expect(stored.body.attributes.defaultIndex).toEqual(
          writeStatus === 200 ? 'base-role-updated' : 'base-role-original'
        );
      } finally {
        await osdTestServer.request
          .delete(root, objectPath)
          .set(AUTHORIZATION_HEADER_NAME, ADMIN_CREDENTIALS)
          .set('securitytenant', name);
        for (const entity of ['internalusers', 'roles', 'tenants']) {
          await osdTestServer.request
            .delete(root, `/api/v1/configuration/${entity}/${name}`)
            .set(AUTHORIZATION_HEADER_NAME, ADMIN_CREDENTIALS);
        }
      }
    }
  );
});
