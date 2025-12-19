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
import { IRouter } from 'opensearch-dashboards/server';
import { schema } from '@osd/config-schema';

/* ******************* Schemas ******************* */

const stringArray = schema.arrayOf(schema.string());

// Inner object allowed on each access level
const recipientsSchema = schema.object(
  {
    users: schema.maybe(stringArray),
    roles: schema.maybe(stringArray),
    backend_roles: schema.maybe(stringArray),
  },
  {
    unknowns: 'forbid',
    validate: (v) => {
      if (!v.users && !v.roles && !v.backend_roles) {
        return 'Each share_with entry must include at least one of "users", "roles", or "backend_roles".';
      }
    },
  }
);

// share_with shape used by both PUT and PATCH (add/revoke)
const shareWithSchema = schema.recordOf(schema.string(), recipientsSchema);

// PUT body must include non-empty share_with
const putBodySchema = schema.object(
  {
    resource_id: schema.string({ minLength: 1 }),
    resource_type: schema.string({ minLength: 1 }),
    share_with: shareWithSchema,
  },
  {
    unknowns: 'allow',
    validate: (val) => {
      if (Object.keys(val.share_with).length === 0) {
        return '"share_with" must not be empty.';
      }
    },
  }
);

// PATCH schema: add/revoke must be shareWithSchema
const postBodySchema = schema.object(
  {
    resource_id: schema.string({ minLength: 1 }),
    resource_type: schema.string({ minLength: 1 }),
    add: schema.maybe(shareWithSchema),
    revoke: schema.maybe(shareWithSchema),
  },
  {
    validate: (value) => {
      if (!value.add && !value.revoke) {
        return 'Request body must include at least one of "add" or "revoke".';
      }
    },
  }
);

/* *******************Route definitions******************* */

const SECURITY_RESOURCE_API_PREFIX = '/_plugins/_security/api/resource';
const LIST_TYPES_API = `${SECURITY_RESOURCE_API_PREFIX}/types`;
const LIST_SHARING_INFO_API = `${SECURITY_RESOURCE_API_PREFIX}/list`;
const SHARE_API = `${SECURITY_RESOURCE_API_PREFIX}/share`;

export function defineResourceAccessManagementRoutes(router: IRouter, dataSourceEnabled: boolean) {
  // GET registered resource types
  router.get(
    {
      path: '/api/resource/types',
      validate: {
        query: schema.object({
          dataSourceId: schema.maybe(schema.string()),
        }),
      },
    },
    async (context, request, response) => {
      try {
        if (dataSourceEnabled && request.query?.dataSourceId) {
          const client = context.dataSource.opensearch.legacy.getClient(request.query.dataSourceId);
          const result = await client.callAPI('opensearch_security.listResourceTypes', {});
          return response.ok({ body: result as any });
        } else {
          const client = context.core.opensearch.client.asCurrentUser;
          const result = await client.transport.request({
            method: 'GET',
            path: LIST_TYPES_API,
          });
          return response.ok({ body: result.body });
        }
      } catch (error: any) {
        return response.customError({ statusCode: error.statusCode || 500, body: error.message });
      }
    }
  );

  // GET accessible shared resources filtered by resourceType
  router.get(
    {
      path: '/api/resource/list',
      validate: {
        query: schema.object({
          resourceType: schema.string(),
          dataSourceId: schema.maybe(schema.string()),
        }),
      },
    },
    async (context, request, response) => {
      try {
        const { resourceType } = request.query as { resourceType: string };
        if (dataSourceEnabled && request.query?.dataSourceId) {
          const client = context.dataSource.opensearch.legacy.getClient(request.query.dataSourceId);
          const result = await client.callAPI('opensearch_security.listResourceSharing', {
            resource_type: resourceType,
          });
          return response.ok({ body: result as any });
        } else {
          const client = context.core.opensearch.client.asCurrentUser;
          const result = await client.transport.request({
            method: 'GET',
            path: LIST_SHARING_INFO_API,
            querystring: { resource_type: resourceType },
          });
          return response.ok({ body: result.body });
        }
      } catch (error: any) {
        return response.customError({ statusCode: error.statusCode || 500, body: error.message });
      }
    }
  );

  // GET sharing info for a specific resource
  router.get(
    {
      path: '/api/resource/view',
      validate: {
        query: schema.object({
          resourceId: schema.string(),
          resourceType: schema.string(),
          dataSourceId: schema.maybe(schema.string()),
        }),
      },
    },
    async (context, request, response) => {
      try {
        const { resourceId, resourceType } = request.query as {
          resourceId: string;
          resourceType: string;
        };
        if (dataSourceEnabled && request.query?.dataSourceId) {
          const client = context.dataSource.opensearch.legacy.getClient(request.query.dataSourceId);
          const result = await client.callAPI('opensearch_security.getResourceSharing', {
            resource_id: resourceId,
            resource_type: resourceType,
          });
          return response.ok({ body: result as any });
        } else {
          const client = context.core.opensearch.client.asCurrentUser;
          const result = await client.transport.request({
            method: 'GET',
            path: SHARE_API,
            querystring: { resource_id: resourceId, resource_type: resourceType },
          });
          return response.ok({ body: result.body });
        }
      } catch (error: any) {
        return response.customError({ statusCode: error.statusCode || 500, body: error.message });
      }
    }
  );

  // PUT share a resource — requires `share_with`
  router.put(
    {
      path: '/api/resource/share',
      validate: {
        body: putBodySchema,
        query: schema.object({
          dataSourceId: schema.maybe(schema.string()),
        }),
      },
    },
    async (context, request, response) => {
      try {
        if (dataSourceEnabled && request.query?.dataSourceId) {
          const client = context.dataSource.opensearch.legacy.getClient(request.query.dataSourceId);
          const result = await client.callAPI('opensearch_security.shareResource', request.body);
          return response.ok({ body: result as any });
        } else {
          const client = context.core.opensearch.client.asCurrentUser;
          const result = await client.transport.request({
            method: 'PUT',
            path: SHARE_API,
            body: request.body,
          });
          return response.ok({ body: result.body });
        }
      } catch (error: any) {
        return response.customError({ statusCode: error.statusCode || 500, body: error.message });
      }
    }
  );

  // POST update sharing — `add`/`revoke` adhere to share_with schema
  router.post(
    {
      path: '/api/resource/update_sharing',
      validate: {
        body: postBodySchema,
        query: schema.object({
          dataSourceId: schema.maybe(schema.string()),
        }),
      },
    },
    async (context, request, response) => {
      try {
        if (dataSourceEnabled && request.query?.dataSourceId) {
          const client = context.dataSource.opensearch.legacy.getClient(request.query.dataSourceId);
          const result = await client.callAPI(
            'opensearch_security.updateResourceSharing',
            request.body
          );
          return response.ok({ body: result as any });
        } else {
          const client = context.core.opensearch.client.asCurrentUser;
          const result = await client.transport.request({
            method: 'POST',
            path: SHARE_API,
            body: request.body,
          });
          return response.ok({ body: result.body });
        }
      } catch (error: any) {
        return response.customError({ statusCode: error.statusCode || 500, body: error.message });
      }
    }
  );
}
