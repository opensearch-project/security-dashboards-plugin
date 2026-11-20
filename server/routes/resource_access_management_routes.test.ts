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

import { httpServerMock } from '../../../../src/core/server/http/http_server.mocks';
import { opensearchDashboardsResponseFactory } from '../../../../src/core/server/http/router/response';
import { captureRoutes } from '../../test/helper/route_capture';
import { defineResourceAccessManagementRoutes } from './resource_access_management_routes';

function setup(dataSourceEnabled: boolean) {
  const capture = captureRoutes();
  defineResourceAccessManagementRoutes(capture.router, dataSourceEnabled);

  const transportRequest = jest.fn().mockResolvedValue({ body: { local: true } });
  const callAPI = jest.fn().mockResolvedValue({ remote: true });
  const getClient = jest.fn(() => ({ callAPI }));
  const context = {
    core: {
      opensearch: { client: { asCurrentUser: { transport: { request: transportRequest } } } },
    },
    dataSource: { opensearch: { legacy: { getClient } } },
  };
  return { routes: capture.routes, context, transportRequest, callAPI, getClient };
}

const shareBody = {
  resource_id: 'r1',
  resource_type: 'sample-resource',
  share_with: { read_only: { users: ['bob'] } },
};
const updateBody = {
  resource_id: 'r1',
  resource_type: 'sample-resource',
  add: { read_only: { roles: ['analyst'] } },
};

const cases = [
  {
    route: 'GET /api/resource/types',
    query: {},
    body: undefined,
    local: { method: 'GET', path: '/_plugins/_security/api/resource/types' },
    remote: ['opensearch_security.listResourceTypes', {}],
  },
  {
    route: 'GET /api/resource/list',
    query: { resourceType: 'sample-resource' },
    body: undefined,
    local: {
      method: 'GET',
      path: '/_plugins/_security/api/resource/list',
      querystring: { resource_type: 'sample-resource' },
    },
    remote: ['opensearch_security.listResourceSharing', { resource_type: 'sample-resource' }],
  },
  {
    route: 'GET /api/resource/view',
    query: { resourceId: 'r1', resourceType: 'sample-resource' },
    body: undefined,
    local: {
      method: 'GET',
      path: '/_plugins/_security/api/resource/share',
      querystring: { resource_id: 'r1', resource_type: 'sample-resource' },
    },
    remote: [
      'opensearch_security.getResourceSharing',
      { resource_id: 'r1', resource_type: 'sample-resource' },
    ],
  },
  {
    route: 'PUT /api/resource/share',
    query: {},
    body: shareBody,
    local: { method: 'PUT', path: '/_plugins/_security/api/resource/share', body: shareBody },
    remote: ['opensearch_security.shareResource', { body: shareBody }],
  },
  {
    route: 'POST /api/resource/update_sharing',
    query: {},
    body: updateBody,
    local: { method: 'POST', path: '/_plugins/_security/api/resource/share', body: updateBody },
    remote: ['opensearch_security.updateResourceSharing', { body: updateBody }],
  },
];

describe('resource access management routes', () => {
  test('registers all routes', () => {
    const { routes } = setup(false);
    expect(Object.keys(routes).sort()).toEqual(cases.map((c) => c.route).sort());
  });

  describe.each(cases)('$route', ({ route, query, body, local, remote }) => {
    test('calls the local cluster when no data source is given', async () => {
      const { routes, context, transportRequest, getClient } = setup(true);
      const request = httpServerMock.createOpenSearchDashboardsRequest({ query, body });

      const res = await routes[route].handler(
        context,
        request,
        opensearchDashboardsResponseFactory
      );

      expect(transportRequest).toHaveBeenCalledWith(local);
      expect(getClient).not.toHaveBeenCalled();
      expect(res.status).toBe(200);
      expect(res.payload).toEqual({ local: true });
    });

    test('calls the data source client when a data source is given and enabled', async () => {
      const { routes, context, transportRequest, callAPI, getClient } = setup(true);
      const request = httpServerMock.createOpenSearchDashboardsRequest({
        query: { ...query, dataSourceId: 'ds-1' },
        body,
      });

      const res = await routes[route].handler(
        context,
        request,
        opensearchDashboardsResponseFactory
      );

      expect(getClient).toHaveBeenCalledWith('ds-1');
      expect(callAPI).toHaveBeenCalledWith(...remote);
      expect(transportRequest).not.toHaveBeenCalled();
      expect(res.status).toBe(200);
      expect(res.payload).toEqual({ remote: true });
    });

    test('ignores the data source id when data sources are disabled', async () => {
      const { routes, context, transportRequest, getClient } = setup(false);
      const request = httpServerMock.createOpenSearchDashboardsRequest({
        query: { ...query, dataSourceId: 'ds-1' },
        body,
      });

      await routes[route].handler(context, request, opensearchDashboardsResponseFactory);

      expect(getClient).not.toHaveBeenCalled();
      expect(transportRequest).toHaveBeenCalledWith(local);
    });

    test('returns the backend error status and message', async () => {
      const { routes, context, transportRequest } = setup(false);
      transportRequest.mockRejectedValue(
        Object.assign(new Error('forbidden'), { statusCode: 403 })
      );
      const request = httpServerMock.createOpenSearchDashboardsRequest({ query, body });

      const res = await routes[route].handler(
        context,
        request,
        opensearchDashboardsResponseFactory
      );

      expect(res.status).toBe(403);
      expect(res.payload).toBe('forbidden');
    });

    test('defaults the error status to 500', async () => {
      const { routes, context, callAPI } = setup(true);
      callAPI.mockRejectedValue(new Error('unreachable'));
      const request = httpServerMock.createOpenSearchDashboardsRequest({
        query: { ...query, dataSourceId: 'ds-1' },
        body,
      });

      const res = await routes[route].handler(
        context,
        request,
        opensearchDashboardsResponseFactory
      );

      expect(res.status).toBe(500);
      expect(res.payload).toBe('unreachable');
    });
  });

  describe('body validation', () => {
    const { routes } = setup(false);
    const putSchema = routes['PUT /api/resource/share'].config.validate.body;
    const postSchema = routes['POST /api/resource/update_sharing'].config.validate.body;

    test('share accepts a valid body and keeps unknown keys', () => {
      expect(putSchema.validate({ ...shareBody, extra: 1 })).toEqual({ ...shareBody, extra: 1 });
    });

    test('share rejects an empty share_with', () => {
      expect(() => putSchema.validate({ ...shareBody, share_with: {} })).toThrow(
        '"share_with" must not be empty.'
      );
    });

    test('share rejects a recipient entry without users, roles or backend_roles', () => {
      expect(() => putSchema.validate({ ...shareBody, share_with: { read_only: {} } })).toThrow(
        /must include at least one of "users", "roles", or "backend_roles"/
      );
    });

    test('share rejects unknown recipient keys and empty ids', () => {
      expect(() =>
        putSchema.validate({ ...shareBody, share_with: { read_only: { groups: ['g'] } } })
      ).toThrow(/groups/);
      expect(() => putSchema.validate({ ...shareBody, resource_id: '' })).toThrow(/resource_id/);
    });

    test('update_sharing requires add or revoke', () => {
      expect(postSchema.validate(updateBody)).toEqual(updateBody);
      const revokeOnly = {
        resource_id: 'r1',
        resource_type: 't',
        revoke: { read_only: { backend_roles: ['b'] } },
      };
      expect(postSchema.validate(revokeOnly)).toEqual(revokeOnly);
      expect(() => postSchema.validate({ resource_id: 'r1', resource_type: 't' })).toThrow(
        'Request body must include at least one of "add" or "revoke".'
      );
    });
  });

  describe('query validation', () => {
    const { routes } = setup(false);
    const listQuery = routes['GET /api/resource/list'].config.validate.query;
    const viewQuery = routes['GET /api/resource/view'].config.validate.query;

    test('list requires resourceType', () => {
      expect(listQuery.validate({ resourceType: 'sample-resource' })).toEqual({
        resourceType: 'sample-resource',
      });
      expect(listQuery.validate({ resourceType: 't', dataSourceId: 'ds-1' })).toEqual({
        resourceType: 't',
        dataSourceId: 'ds-1',
      });
      expect(() => listQuery.validate({})).toThrow(/resourceType/);
    });

    test('view requires resourceId and resourceType', () => {
      expect(viewQuery.validate({ resourceId: 'r1', resourceType: 't' })).toEqual({
        resourceId: 'r1',
        resourceType: 't',
      });
      expect(() => viewQuery.validate({ resourceType: 't' })).toThrow(/resourceId/);
      expect(() => viewQuery.validate({ resourceId: 'r1' })).toThrow(/resourceType/);
    });
  });
});
