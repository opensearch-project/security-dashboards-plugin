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

import { get } from 'lodash';
import {
  SessionStorageFactory,
  IRouter,
  ILegacyClusterClient,
  CoreSetup,
  Logger,
  OpenSearchDashboardsRequest,
  LifecycleResponseFactory,
  AuthToolkit,
  IOpenSearchDashboardsResponse,
  AuthResult,
} from 'opensearch-dashboards/server';
import { SecurityPluginConfigType } from '../../..';
import { SecuritySessionCookie } from '../../../session/security_cookie';
import { ProxyAuthRoutes } from './routes';
import { AuthenticationType } from '../authentication_type';
import { isValidTenant } from '../../../multitenancy/tenant_resolver';

export class ProxyAuthentication extends AuthenticationType {
  private static readonly XFF: string = 'x-forwarded-for';

  public readonly type: string = 'proxy';

  private readonly authType: string = 'proxycache';

  private readonly userHeaderName: string;
  private readonly roleHeaderName: string;

  constructor(
    config: SecurityPluginConfigType,
    sessionStorageFactory: SessionStorageFactory<SecuritySessionCookie>,
    router: IRouter,
    esClient: ILegacyClusterClient,
    coreSetup: CoreSetup,
    logger: Logger
  ) {
    super(config, sessionStorageFactory, router, esClient, coreSetup, logger);

    this.userHeaderName = this.config.proxycache?.user_header?.toLowerCase() || '';
    this.roleHeaderName = this.config.proxycache?.roles_header?.toLowerCase() || '';
  }

  public async init() {
    const routes = new ProxyAuthRoutes(
      this.router,
      this.config,
      this.sessionStorageFactory,
      this.securityClient,
      this.coreSetup
    );
    routes.setupRoutes();
  }

  requestIncludesAuthInfo(request: OpenSearchDashboardsRequest): boolean {
    return request.headers[ProxyAuthentication.XFF] && request.headers[this.userHeaderName]
      ? true
      : false;
  }

  async getAdditionalAuthHeader(request: OpenSearchDashboardsRequest): Promise<any> {
    const authHeaders: any = {};
    const customProxyHeader = this.config.proxycache?.proxy_header;
    if (
      customProxyHeader &&
      !request.headers[customProxyHeader] &&
      this.config.proxycache?.proxy_header_ip
    ) {
      // TODO: check how to get remoteIp from OpenSearchDashboardsRequest and add remoteIp to this header
      authHeaders[customProxyHeader] = this.config.proxycache!.proxy_header_ip;
    }
    return authHeaders;
  }

  getCookie(request: OpenSearchDashboardsRequest, authInfo: any): SecuritySessionCookie {
    const cookie: SecuritySessionCookie = {
      username: authInfo.username,
      credentials: {},
      authType: this.authType,
      isAnonymousAuth: false,
      expiryTime: Date.now() + this.config.session.ttl,
    };

    if (this.userHeaderName && request.headers[this.userHeaderName]) {
      cookie.credentials[this.userHeaderName] = request.headers[this.userHeaderName];
    }
    if (this.roleHeaderName && request.headers[this.roleHeaderName]) {
      cookie.credentials[this.roleHeaderName] = request.headers[this.roleHeaderName];
    }
    if (request.headers[ProxyAuthentication.XFF]) {
      cookie.credentials[ProxyAuthentication.XFF] = request.headers[ProxyAuthentication.XFF];
    }
    if (request.headers.authorization) {
      cookie.credentials.authorization = request.headers.authorization;
    }
    return cookie;
  }

  async isValidCookie(cookie: SecuritySessionCookie): Promise<boolean> {
    return (
      cookie.authType === this.type &&
      cookie.username &&
      cookie.expiryTime &&
      cookie.credentials[this.userHeaderName]
    );
  }

  handleUnauthedRequest(
    request: OpenSearchDashboardsRequest,
    response: LifecycleResponseFactory,
    toolkit: AuthToolkit
  ): IOpenSearchDashboardsResponse | AuthResult {
    const loginEndpoint = this.config.proxycache?.login_endpoint;
    if (loginEndpoint) {
      return toolkit.redirected({
        location: loginEndpoint,
      });
    } else {
      return toolkit.notHandled(); // TODO: redirect to error page?
    }
  }

  buildAuthHeaderFromCookie(cookie: SecuritySessionCookie): any {
    const authHeaders: any = {};
    if (get(cookie.credentials, this.userHeaderName)) {
      authHeaders[this.userHeaderName] = cookie.credentials[this.userHeaderName];
      if (get(cookie.credentials, this.roleHeaderName)) {
        authHeaders[this.roleHeaderName] = cookie.credentials[this.roleHeaderName];
      }
      if (get(cookie.credentials, ProxyAuthentication.XFF)) {
        authHeaders[ProxyAuthentication.XFF] = cookie.credentials[ProxyAuthentication.XFF];
      }
      return authHeaders;
    } else if (get(cookie.credentials, 'authorization')) {
      authHeaders.authorization = get(cookie.credentials, 'authorization');
      return authHeaders;
    }
  }
}
