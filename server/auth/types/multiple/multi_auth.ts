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
import { AuthenticationType, IAuthenticationType } from '../authentication_type';
import { AuthType, LOGIN_PAGE_URI } from '../../../../common';
import { composeNextUrlQueryParam } from '../../../utils/next_url';
import { MultiAuthRoutes } from './routes';
import { SecuritySessionCookie } from '../../../session/security_cookie';
import { BasicAuthentication, OpenIdAuthentication, SamlAuthentication } from '../../types';

export class MultipleAuthentication extends AuthenticationType {
  private authTypes: string | string[];
  private BasicAuth!: AuthenticationType;
  private SamlAuth!: AuthenticationType;
  private OidcAuth!: AuthenticationType;
  private authHandlers!: Map<string, AuthenticationType>;

  constructor(
    config: SecurityPluginConfigType,
    sessionStorageFactory: SessionStorageFactory<SecuritySessionCookie>,
    router: IRouter,
    esClient: ILegacyClusterClient,
    coreSetup: CoreSetup,
    logger: Logger
  ) {
    super(config, sessionStorageFactory, router, esClient, coreSetup, logger);
    this.authTypes = this.config.auth.type;
    this.authHandlers = new Map<string, AuthenticationType>();
    this.init();
  }

  private async init() {
    const routes = new MultiAuthRoutes(
      this.router,
      this.config,
      this.sessionStorageFactory,
      this.securityClient,
      this.coreSetup
    );
    routes.setupRoutes();

    for (let i = 0; i < this.authTypes.length; i++) {
      switch (this.authTypes[i].toLowerCase()) {
        case AuthType.BASIC: {
          this.BasicAuth = new BasicAuthentication(
            this.config,
            this.sessionStorageFactory,
            this.router,
            this.esClient,
            this.coreSetup,
            this.logger
          );
          this.authHandlers.set(AuthType.BASIC, this.BasicAuth);
          break;
        }
        case AuthType.OPEN_ID: {
          this.OidcAuth = new OpenIdAuthentication(
            this.config,
            this.sessionStorageFactory,
            this.router,
            this.esClient,
            this.coreSetup,
            this.logger
          );
          this.authHandlers.set(AuthType.OPEN_ID, this.OidcAuth);
          break;
        }
        case AuthType.SAML: {
          this.SamlAuth = new SamlAuthentication(
            this.config,
            this.sessionStorageFactory,
            this.router,
            this.esClient,
            this.coreSetup,
            this.logger
          );
          this.authHandlers.set(AuthType.SAML, this.SamlAuth);
          break;
        }
        default: {
          throw new Error(`Unsupported authentication type: ${this.authTypes[i]}`);
        }
      }
    }
  }

  // override functions inherited from AuthenticationType
  async requestIncludesAuthInfo(
    request: OpenSearchDashboardsRequest<unknown, unknown, unknown, any>
  ): Promise<boolean> {
    const cookie = await this.sessionStorageFactory.asScoped(request).get();
    const reqAuthType = cookie?.authType?.toLowerCase();

    if (reqAuthType && this.authHandlers.has(reqAuthType)) {
      return this.authHandlers.get(reqAuthType)!.requestIncludesAuthInfo(request);
    } else {
      return false;
    }
  }

  async getAdditionalAuthHeader(
    request: OpenSearchDashboardsRequest<unknown, unknown, unknown, any>
  ): Promise<any> {
    const cookie = await this.sessionStorageFactory.asScoped(request).get();
    const reqAuthType = cookie?.authType?.toLowerCase();

    if (reqAuthType && this.authHandlers.has(reqAuthType)) {
      return this.authHandlers.get(reqAuthType)!.getAdditionalAuthHeader(request);
    } else {
      return {};
    }
  }

  async getCookie(
    request: OpenSearchDashboardsRequest,
    authInfo: any
  ): Promise<SecuritySessionCookie> {
    const cookie = await this.sessionStorageFactory.asScoped(request).get();
    const reqAuthType = cookie?.authType?.toLowerCase();

    if (reqAuthType && this.authHandlers.has(reqAuthType)) {
      return this.authHandlers.get(reqAuthType)!.getCookie(request, authInfo);
    } else {
      return {};
    }
  }

  async isValidCookie(cookie: SecuritySessionCookie): Promise<boolean> {
    const reqAuthType = cookie?.authType?.toLowerCase();
    if (reqAuthType && this.authHandlers.has(reqAuthType)) {
      return this.authHandlers.get(reqAuthType)!.isValidCookie(cookie);
    } else {
      return false;
    }
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

      return response.redirected({
        headers: {
          location: `${this.coreSetup.http.basePath.serverBasePath}${LOGIN_PAGE_URI}?${nextUrlParam}`,
        },
      });
    } else {
      return response.unauthorized({
        body: `Authentication required`,
      });
    }
  }

  buildAuthHeaderFromCookie(cookie: SecuritySessionCookie): any {
    const reqAuthType = cookie?.authType?.toLowerCase();

    if (reqAuthType && this.authHandlers.has(reqAuthType)) {
      return this.authHandlers.get(reqAuthType)!.buildAuthHeaderFromCookie(cookie);
    } else {
      return {};
    }
  }
}
