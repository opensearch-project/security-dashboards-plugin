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
  CoreSetup,
  OpenSearchDashboardsRequest,
  SessionStorageFactory,
} from 'opensearch-dashboards/server';
import { SecurityPluginConfigType } from '../..';
import { AUTO_LOGIN_QUERY_PARAM, LOGIN_PAGE_URI } from '../../../common';
import { clearOldVersionCookieValue, SecuritySessionCookie } from '../../session/security_cookie';
import { composeNextUrlQueryParam, validateNextUrl } from '../../utils/next_url';

function validateAutoLogin(autoLogin: string) {
  if (!['true', 'false'].includes(autoLogin.toLowerCase())) {
    return `${AUTO_LOGIN_QUERY_PARAM} must be either "true" or "false".`;
  }
}

export function isAutoLoginEnabled(request: OpenSearchDashboardsRequest): boolean {
  const autoLogin = new URLSearchParams(request.url.search || '').get(AUTO_LOGIN_QUERY_PARAM);
  return autoLogin?.toLowerCase() !== 'false';
}

export function composeLoginPageRedirectLocation(
  request: OpenSearchDashboardsRequest,
  basePath: string
): string {
  const queryParams = new URLSearchParams(composeNextUrlQueryParam(request, basePath));

  if (!isAutoLoginEnabled(request)) {
    queryParams.set(AUTO_LOGIN_QUERY_PARAM, 'false');
  }

  const query = queryParams.toString();
  return `${basePath}${LOGIN_PAGE_URI}${query ? `?${query}` : ''}`;
}

export function registerLoginPageRoute(
  coreSetup: CoreSetup,
  config: SecurityPluginConfigType,
  sessionStorageFactory: SessionStorageFactory<SecuritySessionCookie>
) {
  coreSetup.http.resources.register(
    {
      path: LOGIN_PAGE_URI,
      validate: {
        query: schema.object({
          nextUrl: schema.maybe(
            schema.string({
              validate: (nextUrl) => {
                return validateNextUrl(nextUrl, coreSetup.http.basePath.serverBasePath);
              },
            })
          ),
          [AUTO_LOGIN_QUERY_PARAM]: schema.maybe(
            schema.string({
              validate: validateAutoLogin,
            })
          ),
        }),
      },
      options: {
        authRequired: false,
      },
    },
    async (context, request, response) => {
      sessionStorageFactory.asScoped(request).clear();
      const clearOldVersionCookie = clearOldVersionCookieValue(config);
      return response.renderAnonymousCoreApp({
        headers: {
          'set-cookie': clearOldVersionCookie,
        },
      });
    }
  );
}
