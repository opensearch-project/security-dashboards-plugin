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
  ADMIN_CREDENTIALS,
  ADMIN_USER,
  ADMIN_PASSWORD,
  AUTHORIZATION_HEADER_NAME,
} from '../constant';
import { extractAuthCookie, getAuthCookie } from '../helper/cookie';
import { createOrUpdateEntityAsAdmin, getEntityAsAdmin } from '../helper/entity_operation';

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

  it('create/get/update/list/delete internal user', async () => {
    const testUsername = `test_user_${Date.now()}`;
    const testUserPassword = 'testUserPassword123';

    const createUserResponse = await createOrUpdateEntityAsAdmin(
      root,
      'internalusers',
      testUsername,
      {
        description: 'test user description',
        password: testUserPassword,
        backend_roles: ['arbitrary_backend_role'],
      }
    );
    expect(createUserResponse.status).toEqual(200);

    const getUserResponse = await getEntityAsAdmin(root, 'internalusers', testUsername);
    expect(getUserResponse.status).toEqual(200);
    expect(getUserResponse.body.description).toEqual('test user description');
    expect(getUserResponse.body.backend_roles).toContain('arbitrary_backend_role');

    const listUserResponse = await osdTestServer.request
      .get(root, `/api/v1/configuration/internalusers`)
      .set(AUTHORIZATION_HEADER_NAME, ADMIN_CREDENTIALS);
    expect(listUserResponse.status).toEqual(200);
    expect(listUserResponse.body.total).toBeGreaterThan(2);
    expect(listUserResponse.body.data[testUsername]).toBeTruthy();

    const updateUserResponse = await createOrUpdateEntityAsAdmin(
      root,
      'internalusers',
      testUsername,
      {
        description: 'new description',
        password: testUserPassword,
        backend_roles: ['arbitrary_backend_role'],
      }
    );
    expect(updateUserResponse.status).toEqual(200);

    const getUpdatedUserResponse = await getEntityAsAdmin(root, 'internalusers', testUsername);
    expect(getUpdatedUserResponse.status).toEqual(200);
    expect(getUpdatedUserResponse.body.description).toEqual('new description');

    const deleteUserResponse = await osdTestServer.request
      .delete(root, `/api/v1/configuration/internalusers/${testUsername}`)
      .set(AUTHORIZATION_HEADER_NAME, ADMIN_CREDENTIALS);
    expect(deleteUserResponse.status).toEqual(200);

    const getDeletedUserResponse = await getEntityAsAdmin(root, 'internalusers', testUsername);
    expect(getDeletedUserResponse.status).toEqual(404);
  });

  it('create/get/update/list/delete roles', async () => {
    const testRoleName = `test_role_${Date.now()}`;

    const createRoleResponse = await createOrUpdateEntityAsAdmin(root, 'roles', testRoleName, {
      description: 'role description',
      cluster_permissions: ['cluster_composite_ops'],
      tenant_permissions: [],
      index_permissions: [
        {
          index_patterns: ['.kibana'],
          allowed_actions: ['read', 'index'],
        },
      ],
    });
    expect(createRoleResponse.status).toEqual(200);

    const getCreatedRoleResponse = await getEntityAsAdmin(root, 'roles', testRoleName);
    expect(getCreatedRoleResponse.status).toEqual(200);
    expect(getCreatedRoleResponse.body.description).toEqual('role description');
    expect(getCreatedRoleResponse.body.cluster_permissions).toContainEqual('cluster_composite_ops');
    expect(getCreatedRoleResponse.body.index_permissions).toContainEqual({
      index_patterns: ['.kibana'],
      allowed_actions: ['read', 'index'],
      fls: [],
      masked_fields: [],
    });
    expect(getCreatedRoleResponse.body.tenant_permissions.length).toEqual(0);

    const listRolesResponse = await osdTestServer.request
      .get(root, `/api/v1/configuration/roles`)
      .set(AUTHORIZATION_HEADER_NAME, ADMIN_CREDENTIALS);
    expect(listRolesResponse.status).toEqual(200);
    expect(listRolesResponse.body.total).toBeGreaterThan(0);
    expect(listRolesResponse.body.data).toHaveProperty(testRoleName);

    const updateRoleResponse = await createOrUpdateEntityAsAdmin(root, 'roles', testRoleName, {
      description: 'new role description',
      cluster_permissions: ['cluster_composite_ops'],
      tenant_permissions: [],
      index_permissions: [
        {
          index_patterns: ['.kibana_1'],
          allowed_actions: ['read', 'index'],
        },
      ],
    });
    expect(updateRoleResponse.status).toEqual(200);

    const getUpdatedRoleResponse = await getEntityAsAdmin(root, 'roles', testRoleName);
    expect(getUpdatedRoleResponse.status).toEqual(200);
    expect(getUpdatedRoleResponse.body.description).toEqual('new role description');
    expect(getUpdatedRoleResponse.body.index_permissions[0].index_patterns).toContain('.kibana_1');

    const deleteRoleResponse = await osdTestServer.request
      .delete(root, `/api/v1/configuration/roles/${testRoleName}`)
      .set(AUTHORIZATION_HEADER_NAME, ADMIN_CREDENTIALS);
    expect(deleteRoleResponse.status).toEqual(200);

    const getDeletedRoleResponse = await getEntityAsAdmin(root, 'roles', testRoleName);
    expect(getDeletedRoleResponse.status).toEqual(404);
  });

  it('create/update action groups', async () => {
    const actionGroupName = `test_action_group_${Date.now()}`;

    const createActionGroupResponse = await createOrUpdateEntityAsAdmin(
      root,
      'actiongroups',
      actionGroupName,
      {
        description: 'action group description',
        allowed_actions: ['indices:data/read*'],
      }
    );
    expect(createActionGroupResponse.status).toEqual(200);

    const getCreatedActionGroupResponse = await getEntityAsAdmin(
      root,
      'actiongroups',
      actionGroupName
    );
    expect(getCreatedActionGroupResponse.status).toEqual(200);
    expect(getCreatedActionGroupResponse.body.description).toEqual('action group description');
    expect(getCreatedActionGroupResponse.body.allowed_actions.length).toEqual(1);
    expect(getCreatedActionGroupResponse.body.allowed_actions).toContainEqual('indices:data/read*');

    const updateActionGroupResponse = await createOrUpdateEntityAsAdmin(
      root,
      'actiongroups',
      actionGroupName,
      {
        description: 'new action group description',
        allowed_actions: ['indices:data/read*', 'indices:admin/mappings/fields/get*'],
      }
    );
    expect(updateActionGroupResponse.status).toEqual(200);

    const getUpdatedActionGroupResponse = await getEntityAsAdmin(
      root,
      'actiongroups',
      actionGroupName
    );
    expect(getUpdatedActionGroupResponse.status).toEqual(200);
    expect(getUpdatedActionGroupResponse.body.description).toEqual('new action group description');
    expect(getUpdatedActionGroupResponse.body.allowed_actions.length).toEqual(2);
    expect(getUpdatedActionGroupResponse.body.allowed_actions).toContainEqual(
      'indices:admin/mappings/fields/get*'
    );
  });

  it('create tenants', async () => {
    const testTenantName = `test_tenant_${Date.now()}`;

    const createTenantResponse = await createOrUpdateEntityAsAdmin(
      root,
      'tenants',
      testTenantName,
      {
        description: 'test tenant description',
      }
    );
    expect(createTenantResponse.status).toEqual(200);
  });

  it('create role mapping', async () => {
    const dummyRoleName = `dummy_role_${Date.now()}`;

    const createRoleRespone = await createOrUpdateEntityAsAdmin(root, 'roles', dummyRoleName, {
      index_permissions: [
        {
          index_patterns: ['.kibana'],
          allowed_actions: ['read'],
        },
      ],
    });
    expect(createRoleRespone.status).toEqual(200);

    const createRoleMappingResponse = await createOrUpdateEntityAsAdmin(
      root,
      'rolesmapping',
      dummyRoleName,
      {
        description: 'role mapping description',
        users: ['admin'],
      }
    );
    expect(createRoleMappingResponse.status).toEqual(200);
  });

  it('get account info', async () => {
    const testUsername = `test_user_${Date.now()}`;
    const testUserPassword = 'testUserPassword123';

    await createOrUpdateEntityAsAdmin(root, 'internalusers', testUsername, {
      description: 'test user description',
      password: testUserPassword,
    });

    const testUserCred = `${testUsername}:${testUserPassword}`;
    const testUserAuthInfoResponse = await osdTestServer.request
      .get(root, '/api/v1/auth/authinfo')
      .set(AUTHORIZATION_HEADER_NAME, `Basic ${Buffer.from(testUserCred).toString('base64')}`);
    const securityAuthCookie = extractAuthCookie(testUserAuthInfoResponse);

    const getAccountWithCookieResponse = await osdTestServer.request
      .get(root, `/api/v1/configuration/account`)
      .unset(AUTHORIZATION_HEADER_NAME)
      .set('Cookie', securityAuthCookie);
    expect(getAccountWithCookieResponse.status).toEqual(200);

    const getAccountWithCredentialsResponse = await osdTestServer.request
      .get(root, `/api/v1/configuration/account`)
      .set(AUTHORIZATION_HEADER_NAME, `Basic ${Buffer.from(testUserCred).toString('base64')}`);
    expect(getAccountWithCredentialsResponse.status).toEqual(200);
  });

  it('self reset password as non-admin', async () => {
    const testUsername = `test_user_${Date.now()}`;
    const testUserPassword = 'testUserPassword123';
    const readAllRole = 'read_all'; // use predefined "read_all" role

    await createOrUpdateEntityAsAdmin(root, 'internalusers', testUsername, {
      description: 'test user description',
      password: testUserPassword,
      backend_roles: ['arbitrary_backend_role'],
    });

    const getReadAllRoleMappingResponse = await getEntityAsAdmin(root, 'rolesmapping', readAllRole);
    if (getReadAllRoleMappingResponse.status === 404) {
      createOrUpdateEntityAsAdmin(root, 'rolesmapping', readAllRole, {
        backend_roles: [],
        hosts: [],
        users: [testUsername],
      });
    } else {
      const readAllRoleMapping = getReadAllRoleMappingResponse.body;
      const updatedUsers = readAllRoleMapping.users.push(testUsername);
      createOrUpdateEntityAsAdmin(root, 'rolesmapping', readAllRole, {
        backend_roles: [],
        hosts: [],
        users: updatedUsers,
      });
    }

    const testUserCred = `${testUsername}:${testUserPassword}`;
    const testUserAuthInfoResponse = await osdTestServer.request
      .get(root, '/api/v1/auth/authinfo')
      .set(AUTHORIZATION_HEADER_NAME, `Basic ${Buffer.from(testUserCred).toString('base64')}`);
    const securityAuthCookie = extractAuthCookie(testUserAuthInfoResponse);

    const newPassword = `${testUserPassword}_new`;

    const updatePasswordResponse = await osdTestServer.request
      .post(root, `/api/v1/configuration/account`)
      .unset(AUTHORIZATION_HEADER_NAME)
      .set('Cookie', securityAuthCookie)
      .send({
        password: newPassword,
        current_password: testUserPassword,
      });
    expect(updatePasswordResponse.status).toEqual(200);

    const newCred = `${testUsername}:${newPassword}`;
    const newAuthInfoResponse = await osdTestServer.request
      .get(root, '/api/v1/auth/authinfo')
      .set(AUTHORIZATION_HEADER_NAME, `Basic ${Buffer.from(newCred).toString('base64')}`);
    expect(newAuthInfoResponse.status).toEqual(200);
  });

  it('delete cache', async () => {
    const deleteCacheResponse = await osdTestServer.request
      .delete(root, '/api/v1/configuration/cache')
      .set(AUTHORIZATION_HEADER_NAME, ADMIN_CREDENTIALS);
    expect(deleteCacheResponse.status).toEqual(200);

    const adminAuthCookie = await getAuthCookie(root, ADMIN_USER, ADMIN_PASSWORD);
    const deleteCacheWithCookieResponse = await osdTestServer.request
      .delete(root, '/api/v1/configuration/cache')
      .unset(AUTHORIZATION_HEADER_NAME)
      .set('Cookie', adminAuthCookie);
    expect(deleteCacheWithCookieResponse.status).toEqual(200);
  });

  it('restapiinfo', async () => {
    const cred = `${ADMIN_USER}:${ADMIN_PASSWORD}`;
    const restApiInfoWithHeaderResponse = await osdTestServer.request
      .get(root, '/api/v1/restapiinfo')
      .set(AUTHORIZATION_HEADER_NAME, `Basic ${Buffer.from(cred).toString('base64')}`);
    expect(restApiInfoWithHeaderResponse.status).toEqual(200);

    const authCookie = await getAuthCookie(root, ADMIN_USER, ADMIN_PASSWORD);
    const restApiInfoResponse = await osdTestServer.request
      .get(root, '/api/v1/restapiinfo')
      .unset(AUTHORIZATION_HEADER_NAME)
      .set('Cookie', authCookie);
    expect(restApiInfoResponse.status).toEqual(200);
  });

  it('index_mappings', async () => {
    const response = await osdTestServer.request
      .post(root, '/api/v1/configuration/index_mappings')
      .set(AUTHORIZATION_HEADER_NAME, ADMIN_CREDENTIALS)
      .send({
        index: ['.kibana'],
      });
    expect(response.status).toEqual(200);
  });

  it('indices api', async () => {
    const response = await osdTestServer.request
      .get(root, '/api/v1/configuration/indices')
      .set(AUTHORIZATION_HEADER_NAME, ADMIN_CREDENTIALS);
    expect(response.status).toEqual(200);
  });

  it('validate DLS', async () => {
    const response = await osdTestServer.request
      .post(root, '/api/v1/configuration/validatedls/.kibana')
      .set(AUTHORIZATION_HEADER_NAME, ADMIN_CREDENTIALS)
      .send({
        query: {
          match_all: {},
        },
      });
    expect(response.status).toEqual(200);
  });
});
