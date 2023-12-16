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
import { AllHtmlEntities } from 'html-entities';
import { IRouter, SessionStorageFactory } from '../../../../src/core/server';
import { SecuritySessionCookie } from '../session/security_cookie';
import { SecurityClient } from '../backend/opensearch_security_client';

export function setupMultitenantRoutes(
  router: IRouter,
  sessionStroageFactory: SessionStorageFactory<SecuritySessionCookie>,
  securityClient: SecurityClient
) {
  const PREFIX: string = '/api/v1';

  const entities = new AllHtmlEntities();

  /**
   * Updates selected tenant.
   */
  router.post(
    {
      path: `${PREFIX}/multitenancy/tenant`,
      validate: {
        body: schema.object({
          username: schema.string(),
          tenant: schema.string(),
        }),
      },
    },
    async (context, request, response) => {
      const tenant = request.body.tenant;

      const cookie: SecuritySessionCookie | null = await sessionStroageFactory
        .asScoped(request)
        .get();
      if (!cookie) {
        return response.badRequest({
          body: 'Invalid cookie',
        });
      }
      cookie.tenant = tenant;
      sessionStroageFactory.asScoped(request).set(cookie);
      return response.ok({
        body: entities.encode(tenant),
      });
    }
  );

  /**
   * Gets current selected tenant from session.
   */
  router.get(
    {
      path: `${PREFIX}/multitenancy/tenant`,
      validate: false,
    },
    async (context, request, response) => {
      const cookie = await sessionStroageFactory.asScoped(request).get();
      if (!cookie) {
        return response.badRequest({
          body: 'Invalid cookie.',
        });
      }
      return response.ok({
        body: entities.encode(cookie.tenant),
      });
    }
  );

  /**
   * Gets multitenant info of current user.
   *
   * Sample response of this API:
   * {
   *   "user_name": "admin",
   *   "not_fail_on_forbidden_enabled": false,
   *   "opensearch_dashboards_mt_enabled": true,
   *   "opensearch_dashboards_index": ".opensearch_dashboards",
   *   "opensearch_dashboards_server_user": "opensearch_dashboardsserver"
   * }
   */
  router.get(
    {
      path: `${PREFIX}/multitenancy/info`,
      validate: false,
    },
    async (context, request, response) => {
      try {
        const esResponse = await securityClient.getMultitenancyInfo(request);
        return response.ok({
          body: esResponse,
          headers: {
            'content-type': 'application/json',
          },
        });
      } catch (error) {
        return response.internalError({
          body: error.message,
        });
      }
    }
  );

  router.put(
    {
      path: '/api/v1/configuration/tenancy/config',
      validate: {
        body: schema.object({
          multitenancy_enabled: schema.boolean(),
          private_tenant_enabled: schema.boolean(),
          default_tenant: schema.string(),
        }),
      },
    },
    async (context, request, response) => {
      try {
        const esResponse = await securityClient.putMultitenancyConfigurations(
          request,
          request.body
        );
        return response.ok({
          body: esResponse,
          headers: {
            'content-type': 'application/json',
          },
        });
      } catch (error) {
        return response.internalError({
          body: error.message,
        });
      }
    }
  );

  router.post(
    {
      // FIXME: Seems this is not being used, confirm and delete if not used anymore
      path: `${PREFIX}/multitenancy/migrate/{tenantindex}`,
      validate: {
        params: schema.object({
          tenantindex: schema.string(),
        }),
        query: schema.object({
          force: schema.literal('true'),
        }),
      },
    },
    async (context, request, response) => {
      return response.ok(); // TODO: implement tenant index migration logic
    }
  );
}
