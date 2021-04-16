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

import { IRouter } from 'opensearch-dashboards/server';
import { SecurityPluginConfigType } from '..';

export function defineAuthTypeRoutes(router: IRouter, config: SecurityPluginConfigType) {
  /**
   * Auth type API that returns current auth type configured on OpenSearchDashboards Server.
   *
   * GET /api/authtype
   * Response:
   *  200 OK
   *  {
   *    authtype: saml
   *  }
   */
  router.get(
    { path: '/api/authtype', validate: false, options: { authRequired: false } },
    async (context, request, response) => {
      const authType = config.auth.type || 'basicauth';
      return response.ok({
        body: {
          authtype: authType,
        },
      });
    }
  );
}
