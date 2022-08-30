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

import { escape } from 'querystring';
import { CoreSetup } from 'opensearch-dashboards/server';
import { SecurityPluginConfigType } from '../../..';
import {
  SessionStorageFactory,
  IRouter,
  ILegacyClusterClient,
  OpenSearchDashboardsRequest,
  AuthToolkit,
  Logger,
  LifecycleResponseFactory,
  IOpenSearchDashboardsResponse,
  AuthResult,
} from '../../../../../../src/core/server';
import {
  SecuritySessionCookie,
  clearOldVersionCookieValue,
} from '../../../session/security_cookie';
import { SamlAuthRoutes } from './routes';
import { AuthenticationType } from '../authentication_type';

export class SamlAuthentication extends AuthenticationType {
  public static readonly AUTH_HEADER_NAME = 'authorization';

  public readonly type: string = 'saml';

  constructor(
    config: SecurityPluginConfigType,
    sessionStorageFactory: SessionStorageFactory<SecuritySessionCookie>,
    router: IRouter,
    esClient: ILegacyClusterClient,
    coreSetup: CoreSetup,
    logger: Logger
  ) {
    super(config, sessionStorageFactory, router, esClient, coreSetup, logger);
    this.setupRoutes();
  }

  private generateNextUrl(request: OpenSearchDashboardsRequest): string {
    const path =
      this.coreSetup.http.basePath.serverBasePath +
      (request.url.path || '/app/opensearch-dashboards');
    console.log('generateNextUrl:: path::');
    console.log(path);
    return escape(path);
  }

  private redirectToLoginUri(request: OpenSearchDashboardsRequest, toolkit: AuthToolkit) {
    const nextUrl = this.generateNextUrl(request);
    const clearOldVersionCookie = clearOldVersionCookieValue(this.config);
    console.log('nextUrl::');
    console.log(nextUrl);
    return toolkit.redirected({
      location: `${this.coreSetup.http.basePath.serverBasePath}/auth/saml/login?nextUrl=${nextUrl}`,
      'set-cookie': clearOldVersionCookie,
    });
  }

  private setupRoutes(): void {
    const samlAuthRoutes = new SamlAuthRoutes(
      this.router,
      this.config,
      this.sessionStorageFactory,
      this.securityClient,
      this.coreSetup
    );
    samlAuthRoutes.setupRoutes();
  }

  requestIncludesAuthInfo(request: OpenSearchDashboardsRequest): boolean {
    console.log('saml request.headers::');
    console.log(request.headers);
    return request.headers[SamlAuthentication.AUTH_HEADER_NAME] ? true : false;
  }

  getAdditionalAuthHeader(request: OpenSearchDashboardsRequest): any {
    return {};
  }

  async getCookie(
    request: OpenSearchDashboardsRequest,
    authInfo: any
  ): Promise<SecuritySessionCookie> {
    const sessionStore = await this.sessionStorageFactory.asScoped(request).get();
    const reqAuthType = sessionStore?.authType;
    console.log('reqAuthType::');
    console.log(reqAuthType);

    return {
      username: authInfo.user_name,
      credentials: {
        authHeaderValue: request.headers[SamlAuthentication.AUTH_HEADER_NAME],
      },
      // authType: this.type,
      authType: reqAuthType,
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
  ): IOpenSearchDashboardsResponse | AuthResult {
    console.log('saml request::');
    console.log(request);
    if (this.isPageRequest(request)) {
      console.log('this.isPageRequest(request)::true');
      return this.redirectToLoginUri(request, toolkit);
    } else {
      console.log('this.isPageRequest(request)::false');
      return response.unauthorized();
    }
  }

  buildAuthHeaderFromCookie(cookie: SecuritySessionCookie): any {
    console.log('Enter buildAuthHeaderFromCookie::');
    const headers: any = {};
    headers[SamlAuthentication.AUTH_HEADER_NAME] = cookie.credentials?.authHeaderValue;
    console.log('headers::');
    console.log(headers);
    return headers;
  }
}
