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

import { schema } from '@osd/config-schema';
import {
  IRouter,
  ResponseError,
  IOpenSearchDashboardsResponse,
  OpenSearchDashboardsResponseFactory,
} from 'opensearch-dashboards/server';
import { API_PREFIX, CONFIGURATION_API_PREFIX, isValidResourceName } from '../../common';

// TODO: consider to extract entity CRUD operations and put it into a client class
export function defineRoutes(router: IRouter) {
  const internalUserSchema = schema.object({
    description: schema.maybe(schema.string()),
    password: schema.maybe(schema.string()),
    backend_roles: schema.arrayOf(schema.string(), { defaultValue: [] }),
    attributes: schema.any({ defaultValue: {} }),
  });

  const actionGroupSchema = schema.object({
    description: schema.maybe(schema.string()),
    allowed_actions: schema.arrayOf(schema.string()),
    // type field is not supported in legacy implementation, comment it out for now.
    // type: schema.oneOf([
    //   schema.literal('cluster'),
    //   schema.literal('index'),
    //   schema.literal('opensearch_dashboards'),
    // ]),
  });

  const roleMappingSchema = schema.object({
    description: schema.maybe(schema.string()),
    backend_roles: schema.arrayOf(schema.string(), { defaultValue: [] }),
    hosts: schema.arrayOf(schema.string(), { defaultValue: [] }),
    users: schema.arrayOf(schema.string(), { defaultValue: [] }),
  });

  const roleSchema = schema.object({
    description: schema.maybe(schema.string()),
    cluster_permissions: schema.arrayOf(schema.string(), { defaultValue: [] }),
    tenant_permissions: schema.arrayOf(schema.any(), { defaultValue: [] }),
    index_permissions: schema.arrayOf(schema.any(), { defaultValue: [] }),
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

  function validateEntityId(resourceName: string) {
    if (!isValidResourceName(resourceName)) {
      return 'Invalid entity name or id.';
    }
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
   *
   * e.g. when listing internal users, response may look like:
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
   * when listing action groups, response will look like:
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
   *     "opensearch_dashboards_user": {
   *       "reserved": true,
   *       "hidden": false,
   *       "description": "Provide the minimum permissions for a opensearch_dashboards user",
   *       "cluster_permissions": ["cluster_composite_ops"],
   *       "index_permissions": [{
   *         "index_patterns": [".opensearch_dashboards", ".opensearch_dashboards-6", ".opensearch_dashboards_*"],
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
   *         "allowed_actions": ["opensearch_dashboards_all_write"]
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
    async (
      context,
      request,
      response
    ): Promise<IOpenSearchDashboardsResponse<any | ResponseError>> => {
      const client = context.security_plugin.esClient.asScoped(request);
      let esResp;
      try {
        esResp = await client.callAsCurrentUser('opensearch_security.listResource', {
          resourceName: request.params.resourceName,
        });
        return response.ok({
          body: {
            total: Object.keys(esResp).length,
            data: esResp,
          },
        });
      } catch (error) {
        console.log(JSON.stringify(error));
        return errorResponse(response, error);
      }
    }
  );

  /**
   * Gets entity by id.
   *
   * the response format differs from different resource types. e.g.
   *
   * for internal user, response will look like:
   * {
   *   "hash": "",
   *   "reserved": false,
   *   "hidden": false,
   *   "backend_roles": [],
   *   "attributes": {},
   *   "static": false
   * }
   *
   * for role, response will look like:
   * {
   *   "reserved": true,
   *   "hidden": false,
   *   "description": "Allow full access to all indices and all cluster APIs",
   *   "cluster_permissions": ["*"],
   *   "index_permissions": [{
   *     "index_patterns": ["*"],
   *     "fls": [],
   *     "masked_fields": [],
   *     "allowed_actions": ["*"]
   *   }],
   *   "tenant_permissions": [{
   *     "tenant_patterns": ["*"],
   *     "allowed_actions": ["opensearch_dashboards_all_write"]
   *   }],
   *   "static": false
   * }
   *
   * for roles mapping, response will look like:
   * {
   *   "reserved": true,
   *   "hidden": false,
   *   "description": "Allow full access to all indices and all cluster APIs",
   *   "cluster_permissions": ["*"],
   *   "index_permissions": [{
   *     "index_patterns": ["*"],
   *     "fls": [],
   *     "masked_fields": [],
   *     "allowed_actions": ["*"]
   *   }],
   *   "tenant_permissions": [{
   *     "tenant_patterns": ["*"],
   *     "allowed_actions": ["opensearch_dashboards_all_write"]
   *   }],
   *   "static": false
   * }
   *
   * for action groups, response will look like:
   * {
   *   "reserved": true,
   *   "hidden": false,
   *   "allowed_actions": ["indices:data/read*", "indices:admin/mappings/fields/get*"],
   *   "type": "index",
   *   "description": "Allow all read operations",
   *   "static": false
   * }
   *
   * for tenant, response will look like:
   * {
   *   "reserved": true,
   *   "hidden": false,
   *   "description": "Global tenant",
   *   "static": false
   * },
   */
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
    async (
      context,
      request,
      response
    ): Promise<IOpenSearchDashboardsResponse<any | ResponseError>> => {
      const client = context.security_plugin.esClient.asScoped(request);
      let esResp;
      try {
        esResp = await client.callAsCurrentUser('opensearch_security.getResource', {
          resourceName: request.params.resourceName,
          id: request.params.id,
        });
        return response.ok({ body: esResp[request.params.id] });
      } catch (error) {
        return errorResponse(response, error);
      }
    }
  );

  /**
   * Deletes an entity by id.
   */
  router.delete(
    {
      path: `${API_PREFIX}/${CONFIGURATION_API_PREFIX}/{resourceName}/{id}`,
      validate: {
        params: schema.object({
          resourceName: schema.string(),
          id: schema.string({
            minLength: 1,
          }),
        }),
      },
    },
    async (
      context,
      request,
      response
    ): Promise<IOpenSearchDashboardsResponse<any | ResponseError>> => {
      const client = context.security_plugin.esClient.asScoped(request);
      let esResp;
      try {
        esResp = await client.callAsCurrentUser('opensearch_security.deleteResource', {
          resourceName: request.params.resourceName,
          id: request.params.id,
        });
        return response.ok({
          body: {
            message: esResp.message,
          },
        });
      } catch (error) {
        return errorResponse(response, error);
      }
    }
  );

  /**
   * Update object with out Id. Resource identification is expected to computed from headers. Eg: auth headers
   *
   * Request sample:
   * /configuration/account
   * {
   *   "password": "new-password",
   *   "current_password": "old-password"
   * }
   */
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
    async (
      context,
      request,
      response
    ): Promise<IOpenSearchDashboardsResponse<any | ResponseError>> => {
      try {
        validateRequestBody(request.params.resourceName, request.body);
      } catch (error) {
        return response.badRequest({ body: error });
      }
      const client = context.security_plugin.esClient.asScoped(request);
      let esResp;
      try {
        esResp = await client.callAsCurrentUser('opensearch_security.saveResourceWithoutId', {
          resourceName: request.params.resourceName,
          body: request.body,
        });
        return response.ok({
          body: {
            message: esResp.message,
          },
        });
      } catch (error) {
        return errorResponse(response, error);
      }
    }
  );

  /**
   * Update entity by Id.
   */
  router.post(
    {
      path: `${API_PREFIX}/${CONFIGURATION_API_PREFIX}/{resourceName}/{id}`,
      validate: {
        params: schema.object({
          resourceName: schema.string(),
          id: schema.string({
            validate: validateEntityId,
          }),
        }),
        body: schema.any(),
      },
    },
    async (
      context,
      request,
      response
    ): Promise<IOpenSearchDashboardsResponse<any | ResponseError>> => {
      try {
        validateRequestBody(request.params.resourceName, request.body);
      } catch (error) {
        return response.badRequest({ body: error });
      }
      const client = context.security_plugin.esClient.asScoped(request);
      let esResp;
      try {
        esResp = await client.callAsCurrentUser('opensearch_security.saveResource', {
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
        return errorResponse(response, error);
      }
    }
  );

  /**
   * Gets authentication info of the user.
   *
   * The response looks like:
   * {
   *   "user": "User [name=admin, roles=[], requestedTenant=__user__]",
   *   "user_name": "admin",
   *   "user_requested_tenant": "__user__",
   *   "remote_address": "127.0.0.1:35044",
   *   "backend_roles": [],
   *   "custom_attribute_names": [],
   *   "roles": ["all_access", "security_manager"],
   *   "tenants": {
   *     "another_tenant": true,
   *     "admin": true,
   *     "global_tenant": true,
   *     "aaaaa": true,
   *     "test tenant": true
   *   },
   *   "principal": null,
   *   "peer_certificates": "0",
   *   "sso_logout_url": null
   * }
   */
  router.get(
    {
      path: `${API_PREFIX}/auth/authinfo`,
      validate: false,
    },
    async (
      context,
      request,
      response
    ): Promise<IOpenSearchDashboardsResponse<any | ResponseError>> => {
      const client = context.security_plugin.esClient.asScoped(request);
      let esResp;
      try {
        esResp = await client.callAsCurrentUser('opensearch_security.authinfo');

        return response.ok({
          body: esResp,
        });
      } catch (error) {
        return errorResponse(response, error);
      }
    }
  );

  router.get(
    {
      path: `${API_PREFIX}/auth/dashboardsinfo`,
      validate: false,
    },
    async (
      context,
      request,
      response
    ): Promise<IOpenSearchDashboardsResponse<any | ResponseError>> => {
      const client = context.security_plugin.esClient.asScoped(request);
      let esResp;
      try {
        esResp = await client.callAsCurrentUser('opensearch_security.dashboardsinfo');

        return response.ok({
          body: esResp,
        });
      } catch (error) {
        return errorResponse(response, error);
      }
    }
  );

  /**
   * Gets audit log configuration。
   *
   * Sample payload:
   * {
   *   "enabled":true,
   *   "audit":{
   *     "enable_rest":false,
   *     "disabled_rest_categories":[
   *       "FAILED_LOGIN",
   *       "AUTHENTICATED"
   *     ],
   *     "enable_transport":true,
   *     "disabled_transport_categories":[
   *       "GRANTED_PRIVILEGES"
   *     ],
   *     "resolve_bulk_requests":true,
   *     "log_request_body":false,
   *     "resolve_indices":true,
   *     "exclude_sensitive_headers":true,
   *     "ignore_users":[
   *       "admin",
   *     ],
   *     "ignore_requests":[
   *       "SearchRequest",
   *       "indices:data/read/*"
   *     ]
   *   },
   *   "compliance":{
   *     "enabled":true,
   *     "internal_config":false,
   *     "external_config":false,
   *     "read_metadata_only":false,
   *     "read_watched_fields":{
   *       "indexName1":[
   *         "field1",
   *         "fields-*"
   *       ]
   *     },
   *     "read_ignore_users":[
   *       "opensearchdashboardsserver",
   *       "operator/*"
   *     ],
   *     "write_metadata_only":false,
   *     "write_log_diffs":false,
   *     "write_watched_indices":[
   *       "indexName2",
   *       "indexPatterns-*"
   *     ],
   *     "write_ignore_users":[
   *       "admin"
   *     ]
   *   }
   * }
   */
  router.get(
    {
      path: `${API_PREFIX}/configuration/audit`,
      validate: false,
    },
    async (
      context,
      request,
      response
    ): Promise<IOpenSearchDashboardsResponse<any | ResponseError>> => {
      const client = context.security_plugin.esClient.asScoped(request);

      let esResp;
      try {
        esResp = await client.callAsCurrentUser('opensearch_security.getAudit');

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

  /**
   * Update audit log configuration。
   *
   * Sample payload:
   * {
   *   "enabled":true,
   *   "audit":{
   *     "enable_rest":false,
   *     "disabled_rest_categories":[
   *       "FAILED_LOGIN",
   *       "AUTHENTICATED"
   *     ],
   *     "enable_transport":true,
   *     "disabled_transport_categories":[
   *       "GRANTED_PRIVILEGES"
   *     ],
   *     "resolve_bulk_requests":true,
   *     "log_request_body":false,
   *     "resolve_indices":true,
   *     "exclude_sensitive_headers":true,
   *     "ignore_users":[
   *       "admin",
   *     ],
   *     "ignore_requests":[
   *       "SearchRequest",
   *       "indices:data/read/*"
   *     ]
   *   },
   *   "compliance":{
   *     "enabled":true,
   *     "internal_config":false,
   *     "external_config":false,
   *     "read_metadata_only":false,
   *     "read_watched_fields":{
   *       "indexName1":[
   *         "field1",
   *         "fields-*"
   *       ]
   *     },
   *     "read_ignore_users":[
   *       "kibanaserver",
   *       "operator/*"
   *     ],
   *     "write_metadata_only":false,
   *     "write_log_diffs":false,
   *     "write_watched_indices":[
   *       "indexName2",
   *       "indexPatterns-*"
   *     ],
   *     "write_ignore_users":[
   *       "admin"
   *     ]
   *   }
   * }
   */
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
        esResp = await client.callAsCurrentUser('opensearch_security.saveAudit', {
          body: request.body,
        });
        return response.ok({
          body: {
            message: esResp.message,
          },
        });
      } catch (error) {
        return errorResponse(response, error);
      }
    }
  );

  /**
   * Deletes cache.
   *
   * Sample response: {"message":"Cache flushed successfully."}
   */
  router.delete(
    {
      path: `${API_PREFIX}/configuration/cache`,
      validate: false,
    },
    async (context, request, response) => {
      const client = context.security_plugin.esClient.asScoped(request);
      let esResponse;
      try {
        esResponse = await client.callAsCurrentUser('opensearch_security.clearCache');
        return response.ok({
          body: {
            message: esResponse.message,
          },
        });
      } catch (error) {
        return errorResponse(response, error);
      }
    }
  );

  /**
   * Gets permission info of current user.
   *
   * Sample response:
   * {
   *   "user": "User [name=admin, roles=[], requestedTenant=__user__]",
   *   "user_name": "admin",
   *   "has_api_access": true,
   *   "disabled_endpoints": {}
   * }
   */
  router.get(
    {
      path: `${API_PREFIX}/restapiinfo`,
      validate: false,
    },
    async (context, request, response) => {
      const client = context.security_plugin.esClient.asScoped(request);
      try {
        const esResponse = await client.callAsCurrentUser('opensearch_security.restapiinfo');
        return response.ok({
          body: esResponse,
        });
      } catch (error) {
        return response.badRequest({
          body: error,
        });
      }
    }
  );

  /**
   * Validates DLS (document level security) query.
   *
   * Request payload is an ES query.
   */
  router.post(
    {
      path: `${API_PREFIX}/${CONFIGURATION_API_PREFIX}/validatedls/{indexName}`,
      validate: {
        params: schema.object({
          // in legacy plugin implmentation, indexName is not used when calling ES API.
          indexName: schema.maybe(schema.string()),
        }),
        body: schema.any(),
      },
    },
    async (context, request, response) => {
      const client = context.security_plugin.esClient.asScoped(request);
      try {
        const esResponse = await client.callAsCurrentUser('opensearch_security.validateDls', {
          body: request.body,
        });
        return response.ok({
          body: esResponse,
        });
      } catch (error) {
        return errorResponse(response, error);
      }
    }
  );

  /**
   * Gets index mapping.
   *
   * Calling ES _mapping API under the hood. see
   * https://www.elastic.co/guide/en/elasticsearch/reference/current/indices-get-mapping.html
   */
  router.post(
    {
      path: `${API_PREFIX}/${CONFIGURATION_API_PREFIX}/index_mappings`,
      validate: {
        body: schema.object({
          index: schema.arrayOf(schema.string()),
        }),
      },
    },
    async (context, request, response) => {
      const client = context.security_plugin.esClient.asScoped(request);
      try {
        const esResponse = await client.callAsCurrentUser('opensearch_security.getIndexMappings', {
          index: request.body.index.join(','),
          ignore_unavailable: true,
          allow_no_indices: true,
        });

        return response.ok({
          body: esResponse,
        });
      } catch (error) {
        return errorResponse(response, error);
      }
    }
  );

  /**
   * Gets all indices, and field mappings.
   *
   * Calls ES API '/_all/_mapping/field/*' under the hood. see
   * https://www.elastic.co/guide/en/elasticsearch/reference/current/indices-get-mapping.html
   */
  router.get(
    {
      path: `${API_PREFIX}/${CONFIGURATION_API_PREFIX}/indices`,
      validate: false,
    },
    async (context, request, response) => {
      const client = context.security_plugin.esClient.asScoped(request);
      try {
        const esResponse = await client.callAsCurrentUser('opensearch_security.indices');
        return response.ok({
          body: esResponse,
        });
      } catch (error) {
        return errorResponse(response, error);
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

function errorResponse(response: OpenSearchDashboardsResponseFactory, error: any) {
  return response.custom({
    statusCode: error.statusCode,
    body: parseEsErrorResponse(error),
  });
}
