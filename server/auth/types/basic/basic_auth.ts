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

import {
  CoreSetup,
  SessionStorageFactory,
  IRouter,
  ILegacyClusterClient,
  OpenSearchDashboardsRequest,
  Logger,
  LifecycleResponseFactory,
  AuthToolkit,
} from 'opensearch-dashboards/server';
import { OpenSearchDashboardsResponse } from 'src/core/server/http/router';
import { SecurityPluginConfigType } from '../../..';
import { SecuritySessionCookie } from '../../../session/security_cookie';
import { BasicAuthRoutes } from './routes';
import { AuthenticationType } from '../authentication_type';
import { LOGIN_PAGE_URI } from '../../../../common';
import { composeNextUrlQueryParam } from '../../../utils/next_url';

export class BasicAuthentication extends AuthenticationType {
  private static readonly AUTH_HEADER_NAME: string = 'authorization';
  public readonly type: string = 'basicauth';

  constructor(
    config: SecurityPluginConfigType,
    sessionStorageFactory: SessionStorageFactory<SecuritySessionCookie>,
    router: IRouter,
    esClient: ILegacyClusterClient,
    coreSetup: CoreSetup,
    logger: Logger
  ) {
    super(config, sessionStorageFactory, router, esClient, coreSetup, logger);

    this.init();
  }

  private async init() {
    const routes = new BasicAuthRoutes(
      this.router,
      this.config,
      this.sessionStorageFactory,
      this.securityClient,
      this.coreSetup
    );
    routes.setupRoutes();
  }

  // override functions inherited from AuthenticationType
  requestIncludesAuthInfo(
    request: OpenSearchDashboardsRequest<unknown, unknown, unknown, any>
  ): boolean {
    return request.headers[BasicAuthentication.AUTH_HEADER_NAME] ? true : false;
  }

  getAdditionalAuthHeader(request: OpenSearchDashboardsRequest<unknown, unknown, unknown, any>) {
    return {};
  }

  getCookie(request: OpenSearchDashboardsRequest, authInfo: any): SecuritySessionCookie {
    if (
      this.config.auth.anonymous_auth_enabled &&
      authInfo.user_name === 'opendistro_security_anonymous'
    ) {
      return {
        username: authInfo.user_name,
        authType: this.type,
        expiryTime: Date.now() + this.config.session.ttl,
        isAnonymousAuth: true,
      };
    }
    return {
      username: authInfo.user_name,
      credentials: {
        authHeaderValue: request.headers[BasicAuthentication.AUTH_HEADER_NAME],
      },
      authType: this.type,
      expiryTime: Date.now() + this.config.session.ttl,
    };
  }

  async isValidCookie(cookie: SecuritySessionCookie): Promise<boolean> {
    return (
      cookie.authType === this.type &&
      cookie.expiryTime &&
      ((cookie.username && cookie.credentials?.authHeaderValue) ||
        (this.config.auth.anonymous_auth_enabled && cookie.isAnonymousAuth))
    );
  }

  handleUnauthedRequest(
    request: OpenSearchDashboardsRequest,
    response: LifecycleResponseFactory,
    toolkit: AuthToolkit
  ): OpenSearchDashboardsResponse {
    if (this.isPageRequest(request)) {
      const nextUrlParam = composeNextUrlQueryParam(
        request,
        this.coreSetup.http.basePath.serverBasePath
      );
      if (this.config.auth.anonymous_auth_enabled) {
        const redirectLocation = `${this.coreSetup.http.basePath.serverBasePath}/auth/anonymous?${nextUrlParam}`;
        return response.redirected({
          headers: {
            location: `${redirectLocation}`,
          },
        });
      } else {
        const redirectLocation = `${this.coreSetup.http.basePath.serverBasePath}${LOGIN_PAGE_URI}?${nextUrlParam}`;
        return response.redirected({
          headers: {
            location: `${redirectLocation}`,
          },
        });
      }
    } else {
      return response.unauthorized({
        body: `Authentication required`,
      });
    }
  }

  buildAuthHeaderFromCookie(cookie: SecuritySessionCookie): any {
    if (this.config.auth.anonymous_auth_enabled && cookie.isAnonymousAuth) {
      return {};
    }
    const headers: any = {};
    Object.assign(headers, { authorization: cookie.credentials?.authHeaderValue });
    return headers;
  }
}
