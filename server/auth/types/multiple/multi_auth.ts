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
import HTTP from 'http';
import HTTPS from 'https';
import { PeerCertificate } from 'tls';
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
import { AuthenticationType } from '../authentication_type';
import { AuthType, LOGIN_PAGE_URI, OPENDISTRO_SECURITY_ANONYMOUS } from '../../../../common';
import { composeNextUrlQueryParam } from '../../../utils/next_url';
import { callTokenEndpoint } from '../openid/helper';
import { MultiAuthRoutes } from './routes';
import { SecuritySessionCookie } from '../../../session/security_cookie';

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

export class MultipleAuthentication extends AuthenticationType {
  private authTypes: string | string[];
  private openIdAuthConfig: OpenIdAuthConfig;
  private wreckClient: typeof wreck;

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
    this.openIdAuthConfig = {};
    this.wreckClient = this.createWreckClient();
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

    for (let i = 0; i < this.authTypes.length; i++) {
      switch (this.authTypes[i].toLowerCase()) {
        case '':
        case AuthType.BASIC: {
          routes.setupBasicRoutes();
          break;
        }
        case AuthType.OPEN_ID: {
          await this.oidcConfigSetup(this.wreckClient);
          routes.setupOidcRoutes(this.openIdAuthConfig, this.wreckClient);
          break;
        }
        case AuthType.SAML: {
          routes.setupSamlRoutes();
          break;
        }
        default: {
          throw new Error(`Unsupported authentication type: ${this.authTypes[i]}`);
        }
      }
    }
  }

  // override functions inherited from AuthenticationType
  requestIncludesAuthInfo(
    request: OpenSearchDashboardsRequest<unknown, unknown, unknown, any>
  ): boolean {
    return request.headers.authorization ? true : false;
  }

  getAdditionalAuthHeader(request: OpenSearchDashboardsRequest<unknown, unknown, unknown, any>) {
    // This function is not used by basicauth, oidc and saml authentication, implementation is needed for jwt and proxy authentication.
    return {};
  }

  async getCookie(
    request: OpenSearchDashboardsRequest,
    authInfo: any
  ): Promise<SecuritySessionCookie> {
    const sessionStore = await this.sessionStorageFactory.asScoped(request).get();
    const reqAuthType = sessionStore?.authType;

    if (
      reqAuthType === AuthType.BASIC &&
      this.config.auth.anonymous_auth_enabled &&
      authInfo.user_name === OPENDISTRO_SECURITY_ANONYMOUS
    ) {
      return {
        username: authInfo.user_name,
        authType: reqAuthType,
        expiryTime: Date.now() + this.config.session.ttl,
        isAnonymousAuth: true,
      };
    }
    return {
      username: authInfo.user_name,
      credentials: {
        authHeaderValue: request.headers.authorization,
      },
      authType: reqAuthType,
      expiryTime: Date.now() + this.config.session.ttl,
    };
  }

  private createWreckClient(): typeof wreck {
    const wreckHttpsOption: WreckHttpsOptions = {};
    if (this.config.openid?.root_ca) {
      wreckHttpsOption.ca = [fs.readFileSync(this.config.openid.root_ca)];
    }
    if (this.config.openid?.verify_hostnames === false) {
      // his.logger.debug(`openId auth 'verify_hostnames' option is off.`);
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

  private async oidcConfigSetup(wreckClient: typeof wreck) {
    const authHeaderName: string = this.config.openid?.header || '';
    this.openIdAuthConfig.authHeaderName = authHeaderName;

    const openIdConnectUrl: string = this.config.openid?.connect_url || '';

    let scope = this.config.openid!.scope;
    if (scope.indexOf('openid') < 0) {
      scope = `openid ${scope}`;
    }
    this.openIdAuthConfig.scope = scope;

    const response = await wreckClient.get(openIdConnectUrl);
    const payload = JSON.parse(response.payload as string);

    this.openIdAuthConfig.authorizationEndpoint = payload.authorization_endpoint;
    this.openIdAuthConfig.tokenEndpoint = payload.token_endpoint;
    this.openIdAuthConfig.endSessionEndpoint = payload.end_session_endpoint;
  }

  async isValidCookie(cookie: SecuritySessionCookie): Promise<boolean> {
    if (cookie.authType === AuthType.BASIC) {
      const result =
        cookie.expiryTime &&
        ((cookie.username && cookie.credentials?.authHeaderValue) ||
          (this.config.auth.anonymous_auth_enabled && cookie.isAnonymousAuth));

      return result;
    } else if (cookie.authType === AuthType.OPEN_ID) {
      if (
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
        } catch (error: any) {
          this.logger.error(error);
          return false;
        }
      } else {
        // no refresh token, and current token is expired
        return false;
      }
    } else if (cookie.authType === AuthType.SAML) {
      return cookie.username && cookie.expiryTime && cookie.credentials?.authHeaderValue;
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
    if (
      cookie.authType === AuthType.BASIC &&
      this.config.auth.anonymous_auth_enabled &&
      cookie.isAnonymousAuth
    ) {
      return {};
    }

    const headers: any = {};
    Object.assign(headers, { authorization: cookie.credentials?.authHeaderValue });

    return headers;
  }
}
