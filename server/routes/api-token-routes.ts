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
  IOpenSearchDashboardsResponse,
  ResponseError,
  OpenSearchDashboardsResponseFactory,
} from 'opensearch-dashboards/server';
import { API_PREFIX } from '../../common';

const API_TOKEN_BACKEND_PATH = '/_plugins/_security/api/apitokens';

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
    statusCode: error.statusCode || 500,
    body: parseEsErrorResponse(error),
  });
}

export function defineApiTokenRoutes(router: IRouter) {
  // List API tokens
  router.get(
    {
      path: `${API_PREFIX}/apitokens`,
      validate: {
        query: schema.object({
          dataSourceId: schema.maybe(schema.string()),
        }),
      },
    },
    async (
      context,
      request,
      response
    ): Promise<IOpenSearchDashboardsResponse<any | ResponseError>> => {
      try {
        const client = context.security_plugin.esClient.asScoped(request);
        const esResp = await client.callAsCurrentUser('transport.request', {
          method: 'GET',
          path: API_TOKEN_BACKEND_PATH,
        });
        return response.ok({ body: esResp });
      } catch (error) {
        return errorResponse(response, error);
      }
    }
  );

  // Create API token
  router.post(
    {
      path: `${API_PREFIX}/apitokens`,
      validate: {
        body: schema.object({
          name: schema.string(),
          cluster_permissions: schema.arrayOf(schema.string(), { defaultValue: [] }),
          index_permissions: schema.arrayOf(schema.any(), { defaultValue: [] }),
          expiration: schema.maybe(schema.number()),
        }),
        query: schema.object({
          dataSourceId: schema.maybe(schema.string()),
        }),
      },
    },
    async (
      context,
      request,
      response
    ): Promise<IOpenSearchDashboardsResponse<any | ResponseError>> => {
      try {
        const client = context.security_plugin.esClient.asScoped(request);
        const esResp = await client.callAsCurrentUser('transport.request', {
          method: 'POST',
          path: API_TOKEN_BACKEND_PATH,
          body: request.body,
        });
        return response.ok({ body: esResp });
      } catch (error) {
        return errorResponse(response, error);
      }
    }
  );

  // Revoke (soft-delete) API token
  router.delete(
    {
      path: `${API_PREFIX}/apitokens/{id}`,
      validate: {
        params: schema.object({
          id: schema.string(),
        }),
        query: schema.object({
          dataSourceId: schema.maybe(schema.string()),
        }),
      },
    },
    async (
      context,
      request,
      response
    ): Promise<IOpenSearchDashboardsResponse<any | ResponseError>> => {
      try {
        const client = context.security_plugin.esClient.asScoped(request);
        const esResp = await client.callAsCurrentUser('transport.request', {
          method: 'DELETE',
          path: `${API_TOKEN_BACKEND_PATH}/${encodeURIComponent(request.params.id)}`,
        });
        return response.ok({ body: esResp });
      } catch (error) {
        return errorResponse(response, error);
      }
    }
  );
}
