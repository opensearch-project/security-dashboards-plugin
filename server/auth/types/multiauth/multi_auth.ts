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
import {
  IOpenSearchDashboardsResponse,
  OpenSearchDashboardsResponse,
} from 'src/core/server/http/router';
import { SecurityPluginConfigType } from '../../..';
import { AuthenticationType } from '../authentication_type';
import { AuthType, LOGIN_PAGE_URI } from '../../../../common';
import { composeNextUrlQueryParam } from '../../../utils/next_url';
import { callTokenEndpoint } from '../openid/helper';
import { MultiAuthRoutes } from './routes';
import {
  SecuritySessionCookie,
  clearOldVersionCookieValue,
} from '../../../session/security_cookie';

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
  private static readonly AUTH_HEADER_NAME: string = 'authorization';
  private static readonly ACCESS_CONTROL_ALLOW_ORIGIN: string = 'authorization';
  public readonly type: string = '';
  private wreckClient: typeof wreck;

  private openIdAuthConfig: OpenIdAuthConfig;
  private authHeaderName: string;
  private openIdConnectUrl: string;
  private authTypes: string;

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

    this.wreckClient = this.createWreckClient();

    this.openIdAuthConfig = {};
    this.authHeaderName = this.config.openid?.header || '';
    this.openIdAuthConfig.authHeaderName = this.authHeaderName;

    this.openIdConnectUrl = this.config.openid?.connect_url || '';
    console.log('openIdConnectUrl:: ' + this.openIdConnectUrl);

    let scope = this.config.openid!.scope;
    if (scope.indexOf('openid') < 0) {
      scope = `openid ${scope}`;
    }
    this.openIdAuthConfig.scope = scope;

    this.init();
  }

  private async init() {
    const routes = new MultiAuthRoutes(
      this.router,
      this.config,
      this.sessionStorageFactory,
      this.openIdAuthConfig,
      this.securityClient,
      this.coreSetup,
      this.wreckClient,
      this.authTypes
    );

    const authArr = this.authTypes.split(',');
    console.log('multiauth authArr::');
    console.log(authArr);

    for (let i = 0; i < authArr.length; i++) {
      switch (authArr[i]) {
        case '':
        case AuthType.BASIC:
          console.log('multiauth basic');
          routes.setupBasicRoutes();
          break;
        case AuthType.OPEN_ID:
          console.log('multiauth openid');
          const response = await this.wreckClient.get(this.openIdConnectUrl);
          const payload = JSON.parse(response.payload as string);

          this.openIdAuthConfig.authorizationEndpoint = payload.authorization_endpoint;
          this.openIdAuthConfig.tokenEndpoint = payload.token_endpoint;
          this.openIdAuthConfig.endSessionEndpoint = payload.end_session_endpoint || undefined;
          routes.setupOidcRoutes(this.openIdAuthConfig, this.wreckClient);
          break;
        case AuthType.SAML:
          // SAML Implementation
          console.log('multiauth saml');
          routes.setupSamlRoutes();
          break;
        default:
          throw new Error(`Unsupported authentication type: ${authArr[i]}`);
      }
    }
  }

  // override functions inherited from AuthenticationType
  requestIncludesAuthInfo(
    request: OpenSearchDashboardsRequest<unknown, unknown, unknown, any>
  ): boolean {
    console.log('multi request.headers::');
    console.log(request.headers);
    return request.headers.authorization ? true : false;
  }

  getAdditionalAuthHeader(request: OpenSearchDashboardsRequest<unknown, unknown, unknown, any>) {
    return {};
  }

  async getCookie(
    request: OpenSearchDashboardsRequest,
    authInfo: any
  ): Promise<SecuritySessionCookie> {
    const sessionStore = await this.sessionStorageFactory.asScoped(request).get();
    const reqAuthType = sessionStore?.authType;
    console.log('multi reqAuthType::');
    console.log(reqAuthType);

    if (
      reqAuthType === AuthType.BASIC &&
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
        authHeaderValue: request.headers.authorization,
      },
      authType: this.type,
      expiryTime: Date.now() + this.config.session.ttl,
    };
    /*
        if(reqAuthType === AuthType.BASIC){
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
                  authHeaderValue: request.headers.authorization,
                },
                authType: this.type,
                expiryTime: Date.now() + this.config.session.ttl,
              };
        }else if(reqAuthType === AuthType.OPEN_ID){
            console.log("getcookie:: request.headers.authorization");
            console.log(request.headers.authorization);
            return {
                username: authInfo.user_name,
                credentials: {
                  authHeaderValue: request.headers.authorization,
                },
                authType: this.type,
                expiryTime: Date.now() + this.config.session.ttl,
              };
        }else if(reqAuthType === AuthType.SAML){
          return {
            username: authInfo.user_name,
            credentials: {
              authHeaderValue: request.headers.authorization,
            },
            authType: this.type,
            expiryTime: Date.now() + this.config.session.ttl,
          };
        }else{
            return {};
        }
        */
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
  async isValidCookie(cookie: SecuritySessionCookie): Promise<boolean> {
    console.log('multi:: cookie.authType::');
    console.log(cookie.authType);
    if (cookie.authType === AuthType.BASIC) {
      console.log('Validate cookie:: basic');
      const result =
        cookie.authType === AuthType.BASIC &&
        cookie.expiryTime &&
        ((cookie.username && cookie.credentials?.authHeaderValue) ||
          (this.config.auth.anonymous_auth_enabled && cookie.isAnonymousAuth));
      console.log(result);
      return result;
    } else if (cookie.authType === AuthType.OPEN_ID) {
      console.log('Validate cookie:: openid');
      if (
        cookie.authType !== AuthType.OPEN_ID ||
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
    } else if (cookie.authType === AuthType.SAML) {
      console.log('cookie status::');
      console.log(
        cookie.authType === AuthType.SAML &&
          cookie.username &&
          cookie.expiryTime &&
          cookie.credentials?.authHeaderValue
      );
      return (
        cookie.authType === AuthType.SAML &&
        cookie.username &&
        cookie.expiryTime &&
        cookie.credentials?.authHeaderValue
      );
    } else {
      return false;
    }
  }

  handleUnauthedRequest(
    request: OpenSearchDashboardsRequest,
    response: LifecycleResponseFactory,
    toolkit: AuthToolkit
  ): OpenSearchDashboardsResponse {
    console.log('Enter handle Unauthented::multi');
    console.log('this.isPageRequest(request)::');
    console.log(this.isPageRequest(request));

    if (this.isPageRequest(request)) {
      const nextUrlParam = composeNextUrlQueryParam(
        request,
        this.coreSetup.http.basePath.serverBasePath
      );

      console.log(nextUrlParam);
      if (this.config.auth.anonymous_auth_enabled) {
        const redirectLocation = `${this.coreSetup.http.basePath.serverBasePath}/auth/anonymous?${nextUrlParam}`;
        return response.redirected({
          headers: {
            location: `${redirectLocation}`,
          },
        });
      } else {
        const redirectLocation = `${this.coreSetup.http.basePath.serverBasePath}${LOGIN_PAGE_URI}?${nextUrlParam}`;
        console.log('redirectLocation::');
        console.log(redirectLocation);
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
    console.log('Enter buildAuthHeaderFromCookie:: multi:: header');
    if (
      cookie.authType === AuthType.BASIC &&
      this.config.auth.anonymous_auth_enabled &&
      cookie.isAnonymousAuth
    ) {
      return {};
    }

    const headers: any = {};
    Object.assign(headers, { authorization: cookie.credentials?.authHeaderValue });

    console.log('buildAuthHeaderFromCookie:: multi:: header');
    console.log(headers);
    return headers;
    /*
        if(cookie.authType === AuthType.BASIC){
          console.log("Enter buildAuthHeaderFromCookie:: basic:: header");
            if (this.config.auth.anonymous_auth_enabled && cookie.isAnonymousAuth) {
                return {};
            }
            const headers: any = {};
            Object.assign(headers, { authorization: cookie.credentials?.authHeaderValue });
            console.log("buildAuthHeaderFromCookie:: basic:: header");
            console.log(headers);
            return headers;
        }else if(cookie.authType === AuthType.OPEN_ID){
          console.log("Enter buildAuthHeaderFromCookie:: openid:: header");
            const headers: any = {};
            const authHeaderValue = cookie.credentials?.authHeaderValue;
            if (authHeaderValue) {
              headers.authorization = authHeaderValue;
            }
            console.log("headers::");
            console.log(headers);
            return headers;
        }else if(cookie.authType === AuthType.SAML){
          console.log("Enter buildAuthHeaderFromCookie:: saml:: header");
            const headers: any = {};
            headers.authorization = cookie.credentials?.authHeaderValue;
            console.log("headers::");
            console.log(headers);
            return headers;
        }else{
            return null;
        }*/
  }
}
