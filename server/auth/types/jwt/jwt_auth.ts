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

import { ParsedUrlQuery } from 'querystring';
import {
  SessionStorageFactory,
  IRouter,
  ILegacyClusterClient,
  CoreSetup,
  OpenSearchDashboardsRequest,
  Logger,
  LifecycleResponseFactory,
  AuthToolkit,
  IOpenSearchDashboardsResponse,
} from 'opensearch-dashboards/server';
import { SecurityPluginConfigType } from '../../..';
import { SecuritySessionCookie } from '../../../session/security_cookie';
import { AuthenticationType } from '../authentication_type';
import { JwtAuthRoutes } from './routes';

export class JwtAuthentication extends AuthenticationType {
  public readonly type: string = 'jwt';

  private authHeaderName: string;

  constructor(
    config: SecurityPluginConfigType,
    sessionStorageFactory: SessionStorageFactory<SecuritySessionCookie>,
    router: IRouter,
    esClient: ILegacyClusterClient,
    coreSetup: CoreSetup,
    logger: Logger
  ) {
    super(config, sessionStorageFactory, router, esClient, coreSetup, logger);
    this.authHeaderName = this.config.jwt?.header.toLowerCase() || 'authorization';
  }

  public async init() {
    const routes = new JwtAuthRoutes(this.router, this.sessionStorageFactory);
    routes.setupRoutes();
  }

  private getTokenFromUrlParam(request: OpenSearchDashboardsRequest): string | undefined {
    const urlParamName = this.config.jwt?.url_param;
    if (urlParamName) {
      const token = request.url.searchParams.get(urlParamName);
      return (token as string) || undefined;
    }
    return undefined;
  }

  private getBearerToken(request: OpenSearchDashboardsRequest): string | undefined {
    const token = this.getTokenFromUrlParam(request);
    if (token) {
      return `Bearer ${token}`;
    }

    // no token in url parameter, try to get token from header
    return (request.headers[this.authHeaderName] as string) || undefined;
  }

  requestIncludesAuthInfo(
    request: OpenSearchDashboardsRequest<unknown, unknown, unknown, any>
  ): boolean {
    if (request.headers[this.authHeaderName]) {
      return true;
    }
    const urlParamName = this.config.jwt?.url_param;
    if (urlParamName && request.url.searchParams.get(urlParamName)) {
      return true;
    }

    return false;
  }

  async getAdditionalAuthHeader(
    request: OpenSearchDashboardsRequest<unknown, unknown, unknown, any>
  ): Promise<any> {
    const header: any = {};
    const token = this.getTokenFromUrlParam(request);
    if (token) {
      header[this.authHeaderName] = `Bearer ${token}`;
    }
    return header;
  }

  getCookie(
    request: OpenSearchDashboardsRequest<unknown, unknown, unknown, any>,
    authInfo: any
  ): SecuritySessionCookie {
    return {
      username: authInfo.user_name,
      credentials: {
        authHeaderValue: this.getBearerToken(request),
      },
      authType: this.type,
      expiryTime: Date.now() + this.config.session.ttl,
    };
  }

  async isValidCookie(cookie: SecuritySessionCookie): Promise<boolean> {
    return (
      cookie.authType === this.type &&
      cookie.username &&
      cookie.expiryTime &&
      cookie.credentials?.authHeaderValue
    );
  }

  handleUnauthedRequest(
    request: OpenSearchDashboardsRequest,
    response: LifecycleResponseFactory,
    toolkit: AuthToolkit
  ): IOpenSearchDashboardsResponse {
    return response.unauthorized();
  }

  buildAuthHeaderFromCookie(cookie: SecuritySessionCookie): any {
    const header: any = {};
    const authHeaderValue = cookie.credentials?.authHeaderValue;
    if (authHeaderValue) {
      header[this.authHeaderName] = authHeaderValue;
    }
    return header;
  }
}
