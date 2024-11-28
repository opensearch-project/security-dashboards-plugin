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
import { KerberosAuthRoutes } from './routes';
import { AuthenticationType } from '../authentication_type';
import { composeNextUrlQueryParam } from '../../../utils/next_url';
import { KERBEROS_AUTH_LOGIN } from '../../../../common';

export class KerberosAuthentication extends AuthenticationType {
  public readonly jwtCookie: string = 'jwt';
  public readonly kerberosHeader: string = 'Negotiate';

  constructor(
    config: SecurityPluginConfigType,
    sessionStorageFactory: SessionStorageFactory<SecuritySessionCookie>,
    router: IRouter,
    esClient: ILegacyClusterClient,
    coreSetup: CoreSetup,
    logger: Logger
  ) {
    super(config, sessionStorageFactory, router, esClient, coreSetup, logger);
  }

  public async init() {
    const routes = new KerberosAuthRoutes(
      this.router,
      this.config,
      this.sessionStorageFactory,
      this.securityClient,
      this.coreSetup
    );
    routes.setupRoutes();
  }

  // Since kerberos authen always attached by SPENGO prevent authentication every request
  requestIncludesAuthInfo(
    request: OpenSearchDashboardsRequest<unknown, unknown, unknown, any>
  ): boolean {
    return false;
  }

  async getAdditionalAuthHeader(
    request: OpenSearchDashboardsRequest<unknown, unknown, unknown, any>
  ): Promise<any> {
    return {};
  }

  getCookie(request: OpenSearchDashboardsRequest, authInfo: any): SecuritySessionCookie {
    return {};
  }

  async isValidCookie(cookie: SecuritySessionCookie): Promise<boolean> {
    return (
      cookie.authType === this.jwtCookie &&
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
      const redirectLocation = `${this.coreSetup.http.basePath.serverBasePath}${KERBEROS_AUTH_LOGIN}?${nextUrlParam}`;
      return response.redirected({
        headers: {
          location: `${redirectLocation}`,
        },
      });
    } else {
      return response.unauthorized({
        body: `Authentication required`,
      });
    }
  }

  buildAuthHeaderFromCookie(
    cookie: SecuritySessionCookie,
    request: OpenSearchDashboardsRequest
  ): any {
    const headers: any = {};
    Object.assign(headers, { authorization: cookie.credentials?.authHeaderValue });
    return headers;
  }
}
