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

import * as fs from 'fs';
import wreck from '@hapi/wreck';
import {
  Logger,
  SessionStorageFactory,
  CoreSetup,
  IRouter,
  ILegacyClusterClient,
  OpenSearchDashboardsRequest,
  LifecycleResponseFactory,
  AuthToolkit,
  IOpenSearchDashboardsResponse,
} from 'opensearch-dashboards/server';
import HTTP from 'http';
import HTTPS from 'https';
import { PeerCertificate } from 'tls';
import { SecurityPluginConfigType } from '../../..';
import { SecuritySessionCookie } from '../../../session/security_cookie';
import { OpenIdAuthRoutes } from './routes';
import { AuthenticationType } from '../authentication_type';
import { callTokenEndpoint } from './helper';
import { composeNextUrlQueryParam } from '../../../utils/next_url';

export interface OpenIdAuthConfig {
  authorizationEndpoint?: string;
  tokenEndpoint?: string;
  endSessionEndpoint?: string;
  scope?: string;

  authHeaderName?: string;
}

export interface WreckHttpsOptions {
  ca?: string | Buffer | Array<string | Buffer>;
  checkServerIdentity?: (host: string, cert: PeerCertificate) => Error | undefined;
}

export class OpenIdAuthentication extends AuthenticationType {
  public readonly type: string = 'openid';

  private openIdAuthConfig: OpenIdAuthConfig;
  private authHeaderName: string;
  private openIdConnectUrl: string;
  private wreckClient: typeof wreck;

  constructor(
    config: SecurityPluginConfigType,
    sessionStorageFactory: SessionStorageFactory<SecuritySessionCookie>,
    router: IRouter,
    esClient: ILegacyClusterClient,
    core: CoreSetup,
    logger: Logger
  ) {
    super(config, sessionStorageFactory, router, esClient, core, logger);

    this.wreckClient = this.createWreckClient();

    this.openIdAuthConfig = {};
    this.authHeaderName = this.config.openid?.header || '';
    this.openIdAuthConfig.authHeaderName = this.authHeaderName;

    this.openIdConnectUrl = this.config.openid?.connect_url || '';
    let scope = this.config.openid!.scope;
    if (scope.indexOf('openid') < 0) {
      scope = `openid ${scope}`;
    }
    this.openIdAuthConfig.scope = scope;

    this.init();
  }

  private async init() {
    try {
      const response = await this.wreckClient.get(this.openIdConnectUrl);
      const payload = JSON.parse(response.payload as string);

      this.openIdAuthConfig.authorizationEndpoint = payload.authorization_endpoint;
      this.openIdAuthConfig.tokenEndpoint = payload.token_endpoint;
      this.openIdAuthConfig.endSessionEndpoint = payload.end_session_endpoint || undefined;

      const routes = new OpenIdAuthRoutes(
        this.router,
        this.config,
        this.sessionStorageFactory,
        this.openIdAuthConfig,
        this.securityClient,
        this.coreSetup,
        this.wreckClient
      );
      routes.setupRoutes();
    } catch (error) {
      this.logger.error(error); // TODO: log more info
      throw new Error('Failed when trying to obtain the endpoints from your IdP');
    }
  }

  private createWreckClient(): typeof wreck {
    const wreckHttpsOption: WreckHttpsOptions = {};
    if (this.config.openid?.root_ca) {
      wreckHttpsOption.ca = [fs.readFileSync(this.config.openid.root_ca)];
    }
    if (this.config.openid?.verify_hostnames === false) {
      this.logger.debug(`openId auth 'verify_hostnames' option is off.`);
      wreckHttpsOption.checkServerIdentity = (host: string, cert: PeerCertificate) => {
        return undefined;
      };
    }
    if (Object.keys(wreckHttpsOption).length > 0) {
      return wreck.defaults({
        agents: {
          http: new HTTP.Agent(),
          https: new HTTPS.Agent(wreckHttpsOption),
          httpsAllowUnauthorized: new HTTPS.Agent({
            rejectUnauthorized: false,
          }),
        },
      });
    } else {
      return wreck;
    }
  }

  requestIncludesAuthInfo(request: OpenSearchDashboardsRequest): boolean {
    return request.headers.authorization ? true : false;
  }

  getAdditionalAuthHeader(request: OpenSearchDashboardsRequest): any {
    return {};
  }

  getCookie(request: OpenSearchDashboardsRequest, authInfo: any): SecuritySessionCookie {
    return {
      username: authInfo.user_name,
      credentials: {
        authHeaderValue: request.headers.authorization,
      },
      authType: this.type,
      expiryTime: Date.now() + this.config.session.ttl,
    };
  }

  // TODO: Add token expiration check here
  async isValidCookie(cookie: SecuritySessionCookie): Promise<boolean> {
    if (
      cookie.authType !== this.type ||
      !cookie.username ||
      !cookie.expiryTime ||
      !cookie.credentials?.authHeaderValue ||
      !cookie.credentials?.expires_at
    ) {
      return false;
    }
    if (cookie.credentials?.expires_at > Date.now()) {
      return true;
    }

    // need to renew id token
    if (cookie.credentials.refresh_token) {
      try {
        const query: any = {
          grant_type: 'refresh_token',
          client_id: this.config.openid?.client_id,
          client_secret: this.config.openid?.client_secret,
          refresh_token: cookie.credentials.refresh_token,
        };
        const refreshTokenResponse = await callTokenEndpoint(
          this.openIdAuthConfig.tokenEndpoint!,
          query,
          this.wreckClient
        );

        // if no id_token from refresh token call, maybe the Idp doesn't allow refresh id_token
        if (refreshTokenResponse.idToken) {
          cookie.credentials = {
            authHeaderValue: `Bearer ${refreshTokenResponse.idToken}`,
            refresh_token: refreshTokenResponse.refreshToken,
            expires_at: Date.now() + refreshTokenResponse.expiresIn! * 1000, // expiresIn is in second
          };
          return true;
        } else {
          return false;
        }
      } catch (error) {
        this.logger.error(error);
        return false;
      }
    } else {
      // no refresh token, and current token is expired
      return false;
    }
  }

  handleUnauthedRequest(
    request: OpenSearchDashboardsRequest,
    response: LifecycleResponseFactory,
    toolkit: AuthToolkit
  ): IOpenSearchDashboardsResponse {
    if (this.isPageRequest(request)) {
      // nextUrl is a key value pair
      const nextUrl = composeNextUrlQueryParam(
        request,
        this.coreSetup.http.basePath.serverBasePath
      );
      return response.redirected({
        headers: {
          location: `${this.coreSetup.http.basePath.serverBasePath}/auth/openid/login?${nextUrl}`,
        },
      });
    } else {
      return response.unauthorized();
    }
  }

  buildAuthHeaderFromCookie(cookie: SecuritySessionCookie): any {
    const header: any = {};
    const authHeaderValue = cookie.credentials?.authHeaderValue;
    if (authHeaderValue) {
      header.authorization = authHeaderValue;
    }
    return header;
  }
}
