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

  // list resources by resource name
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
