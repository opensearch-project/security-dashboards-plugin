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

import { schema } from '@kbn/config-schema';
import { IRouter, ResponseError, IKibanaResponse } from '../../../../src/core/server';
import { API_PREFIX, CONFIGURATION_API_PREFIX } from '../../common';

// TODO: consider to extract entity CRUD operations and put it into a client class
//
// TODO: use following approach to put securityClient into context instead of passing
//       into route handler as parameter
//       refer to https://github.com/elastic/kibana/blob/master/src/core/MIGRATION.md#use-scoped-services
// class Plugin {
//   setup(core: CoreSetup) {
//     const client = core.elasticsearch.createClient('myClient');
//     core.http.registerRouteHandlerContext('myPlugin', (context, req, res) => {
//       return { client: client.asScoped(req) };
//     });

//     router.get(
//       { path: '/api/my-plugin/', validate },
//       async (context, req, res) => {
//         const data = await context.myPlugin.client.callAsCurrentUser('endpoint');
//         ...
//       }
//     );
//   }

export function defineRoutes(router: IRouter) {
  const internalUserSchema = schema.object({
    description: schema.maybe(schema.string()),
    password: schema.string(),
    backend_roles: schema.arrayOf(schema.string()),
    // opendistro_security_roles: schema.nullable(schema.arrayOf(schema.string())),
    attributes: schema.any(),
  });

  const actionGroupSchema = schema.object({
    description: schema.maybe(schema.string()),
    allowed_actions: schema.arrayOf(schema.string()),
    type: schema.oneOf([
      schema.literal('cluster'),
      schema.literal('index'),
      schema.literal('kibana'),
    ]),
  });

  const roleMappingSchema = schema.object({
    description: schema.maybe(schema.string()),
    backend_roles: schema.arrayOf(schema.string()),
    hosts: schema.arrayOf(schema.string()),
    users: schema.arrayOf(schema.string()),
  });

  const roleSchema = schema.object({
    description: schema.maybe(schema.string()),
    cluster_permissions: schema.nullable(schema.arrayOf(schema.string())),
    tenant_permissions: schema.arrayOf(schema.any()),
    index_permissions: schema.arrayOf(schema.any()),
  });

  const tenantSchema = schema.object({
    description: schema.string(),
  });

  const accountSchema = schema.object({
    password: schema.string(),
    current_password: schema.string(),
  });

  const schemaMap: any = {
    internalusers: internalUserSchema,
    actiongroups: actionGroupSchema,
    rolesmapping: roleMappingSchema,
    roles: roleSchema,
    tenants: tenantSchema,
    account: accountSchema,
  };

  function validateRequestBody(resourceName: string, requestBody: any): any {
    const inputSchema = schemaMap[resourceName];
    if (!inputSchema) {
      throw new Error(`Unknown resource ${resourceName}`);
    }
    inputSchema.validate(requestBody); // throws error if validation fail
  }

  /**
   * Lists resources by resource name.
   *
   * The response format is:
   * {
   *   "total": <total_entity_count>,
   *   "data": {
   *     "entity_id_1": { <entity_structure> },
   *     "entity_id_2": { <entity_structure> },
   *     ...
   *   }
   * }
   * Sample response for each resource type:
   *
   * internal user:
   * {
   *   "total": 2,
   *   "data": {
   *     "api_test_user2": {
   *       "hash": "",
   *       "reserved": false,
   *       "hidden": false,
   *       "backend_roles": [],
   *       "attributes": {},
   *       "description": "",
   *       "static": false
   *     },
   *     "api_test_user1": {
   *       "hash": "",
   *       "reserved": false,
   *       "hidden": false,
   *       "backend_roles": [],
   *       "attributes": {},
   *       "static": false
   *     }
   * }
   *
   * action group:
   * {
   *   "total": 2,
   *   "data": {
   *     "read": {
   *       "reserved": true,
   *       "hidden": false,
   *       "allowed_actions": ["indices:data/read*", "indices:admin/mappings/fields/get*"],
   *       "type": "index",
   *       "description": "Allow all read operations",
   *       "static": false
   *     },
   *     "cluster_all": {
   *       "reserved": true,
   *       "hidden": false,
   *       "allowed_actions": ["cluster:*"],
   *       "type": "cluster",
   *       "description": "Allow everything on cluster level",
   *       "static": false
   *     }
   * }
   *
   * role:
   * {
   *   "total": 2,
   *   "data": {
   *     "kibana_user": {
   *       "reserved": true,
   *       "hidden": false,
   *       "description": "Provide the minimum permissions for a kibana user",
   *       "cluster_permissions": ["cluster_composite_ops"],
   *       "index_permissions": [{
   *         "index_patterns": [".kibana", ".kibana-6", ".kibana_*"],
   *         "fls": [],
   *         "masked_fields": [],
   *         "allowed_actions": ["read", "delete", "manage", "index"]
   *       }, {
   *         "index_patterns": [".tasks", ".management-beats"],
   *         "fls": [],
   *         "masked_fields": [],
   *         "allowed_actions": ["indices_all"]
   *       }],
   *       "tenant_permissions": [],
   *       "static": false
   *     },
   *     "all_access": {
   *       "reserved": true,
   *       "hidden": false,
   *       "description": "Allow full access to all indices and all cluster APIs",
   *       "cluster_permissions": ["*"],
   *       "index_permissions": [{
   *         "index_patterns": ["*"],
   *         "fls": [],
   *         "masked_fields": [],
   *         "allowed_actions": ["*"]
   *       }],
   *       "tenant_permissions": [{
   *         "tenant_patterns": ["*"],
   *         "allowed_actions": ["kibana_all_write"]
   *       }],
   *       "static": false
   *     }
   *   }
   * }
   *
   * rolesmapping:
   * {
   *   "total": 2,
   *   "data": {
   *     "security_manager": {
   *       "reserved": false,
   *       "hidden": false,
   *       "backend_roles": [],
   *       "hosts": [],
   *       "users": ["zengyan", "admin"],
   *       "and_backend_roles": []
   *     },
   *     "all_access": {
   *       "reserved": false,
   *       "hidden": false,
   *       "backend_roles": [],
   *       "hosts": [],
   *       "users": ["zengyan", "admin", "indextest"],
   *       "and_backend_roles": []
   *     }
   *   }
   * }
   *
   * tenants:
   * {
   *   "total": 2,
   *   "data": {
   *     "global_tenant": {
   *       "reserved": true,
   *       "hidden": false,
   *       "description": "Global tenant",
   *       "static": false
   *     },
   *     "test tenant": {
   *       "reserved": false,
   *       "hidden": false,
   *       "description": "tenant description",
   *       "static": false
   *     }
   *   }
   * }
   */
  router.get(
    {
      path: `${API_PREFIX}/${CONFIGURATION_API_PREFIX}/{resourceName}`,
      validate: {
        params: schema.object({
          resourceName: schema.string(),
        }),
      },
    },
    async (context, request, response): Promise<IKibanaResponse<any | ResponseError>> => {
      const client = context.security_plugin.esClient.asScoped(request);
      let esResp;
      try {
        esResp = await client.callAsCurrentUser('opendistro_security.listResource', {
          resourceName: request.params.resourceName,
        });
        return response.ok({
          body: {
            total: Object.keys(esResp).length,
            data: esResp,
          },
        });
      } catch (error) {
        return response.custom({
          statusCode: error.statusCode,
          body: parseEsErrorResponse(error),
        });
      }
    }
  );

  // get resource by resource name and id
  router.get(
    {
      path: `${API_PREFIX}/${CONFIGURATION_API_PREFIX}/{resourceName}/{id}`,
      validate: {
        params: schema.object({
          resourceName: schema.string(),
          id: schema.string(),
        }),
      },
    },
    async (context, request, response): Promise<IKibanaResponse<any | ResponseError>> => {
      const client = context.security_plugin.esClient.asScoped(request);
      let esResp;
      try {
        esResp = await client.callAsCurrentUser('opendistro_security.getResource', {
          resourceName: request.params.resourceName,
          id: request.params.id,
        });
        return response.ok({ body: esResp[request.params.id] });
      } catch (error) {
        return response.custom({
          statusCode: error.statusCode,
          body: parseEsErrorResponse(error),
        });
      }
    }
  );

  // delete resource by resource name and id
  router.delete(
    {
      path: `${API_PREFIX}/${CONFIGURATION_API_PREFIX}/{resourceName}/{id}`,
      validate: {
        params: schema.object({
          resourceName: schema.string(),
          id: schema.string(),
        }),
      },
    },
    async (context, request, response): Promise<IKibanaResponse<any | ResponseError>> => {
      const client = context.security_plugin.esClient.asScoped(request);
      let esResp;
      try {
        esResp = await client.callAsCurrentUser('opendistro_security.deleteResource', {
          resourceName: request.params.resourceName,
          id: request.params.id,
        });
        return response.ok({
          body: {
            message: esResp.message,
          },
        });
      } catch (error) {
        return response.custom({
          statusCode: error.statusCode,
          body: parseEsErrorResponse(error),
        });
      }
    }
  );

  // create new resource
  router.post(
    {
      path: `${API_PREFIX}/${CONFIGURATION_API_PREFIX}/{resourceName}`,
      validate: {
        params: schema.object({
          resourceName: schema.string(),
        }),
        body: schema.any(),
      },
    },
    async (context, request, response): Promise<IKibanaResponse<any | ResponseError>> => {
      try {
        validateRequestBody(request.params.resourceName, request.body);
      } catch (error) {
        return response.badRequest({ body: error });
      }
      const client = context.security_plugin.esClient.asScoped(request);
      let esResp;
      try {
        esResp = await client.callAsCurrentUser('opendistro_security.saveResourceWithoutId', {
          resourceName: request.params.resourceName,
          body: request.body,
        });
        return response.ok({
          body: {
            message: esResp.message,
          },
        });
      } catch (error) {
        return response.custom({
          statusCode: error.statusCode,
          body: parseEsErrorResponse(error),
        });
      }
    }
  );

  // update resource by Id
  router.post(
    {
      path: `${API_PREFIX}/${CONFIGURATION_API_PREFIX}/{resourceName}/{id}`,
      validate: {
        params: schema.object({
          resourceName: schema.string(),
          id: schema.string(),
        }),
        body: schema.any(),
      },
    },
    async (context, request, response): Promise<IKibanaResponse<any | ResponseError>> => {
      try {
        validateRequestBody(request.params.resourceName, request.body);
      } catch (error) {
        return response.badRequest({ body: error });
      }
      const client = context.security_plugin.esClient.asScoped(request);
      let esResp;
      try {
        esResp = await client.callAsCurrentUser('opendistro_security.saveResource', {
          resourceName: request.params.resourceName,
          id: request.params.id,
          body: request.body,
        });
        return response.ok({
          body: {
            message: esResp.message,
          },
        });
      } catch (error) {
        return response.customError({
          statusCode: error.statusCode,
          body: parseEsErrorResponse(error),
        });
      }
    }
  );

  router.get(
    {
      path: `${API_PREFIX}/auth/authinfo`,
      validate: false,
    },
    async (context, request, response): Promise<IKibanaResponse<any | ResponseError>> => {
      const client = context.security_plugin.esClient.asScoped(request);
      let esResp;
      try {
        esResp = await client.callAsCurrentUser('opendistro_security.authinfo');

        return response.ok({
          body: esResp,
        });
      } catch (error) {
        return response.custom({
          statusCode: error.statusCode,
          body: parseEsErrorResponse(error),
        });
      }
    }
  );

  router.post(
    {
      path: `${API_PREFIX}/configuration/audit/config`,
      validate: {
        body: schema.any(),
      },
    },
    async (context, request, response) => {
      const client = context.security_plugin.esClient.asScoped(request);
      let esResp;
      try {
        esResp = await client.callAsCurrentUser('opendistro_security.audit', {
          body: request.body,
        });
        return response.ok({
          body: {
            message: esResp.message,
          },
        });
      } catch (error) {
        return response.custom({
          statusCode: error.statusCode,
          body: parseEsErrorResponse(error),
        });
      }
    }
  );
}

function parseEsErrorResponse(error: any) {
  if (error.response) {
    try {
      const esErrorResponse = JSON.parse(error.response);
      return esErrorResponse.reason || error.response;
    } catch (parsingError) {
      return error.response;
    }
  }
  return error.message;
}
