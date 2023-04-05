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
import { Server, ServerStateCookieOptions } from '@hapi/hapi';
import { SecurityPluginConfigType } from '../../..';
import { SecuritySessionCookie } from '../../../session/security_cookie';
import { OpenIdAuthRoutes } from './routes';
import { AuthenticationType } from '../authentication_type';
import { callTokenEndpoint } from './helper';
import { composeNextUrlQueryParam } from '../../../utils/next_url';
import { getExpirationDate } from './helper';
import { AuthType, OPENID_AUTH_LOGIN } from '../../../../common';
import {
  ExtraAuthStorageOptions,
  getExtraAuthStorageValue,
  setExtraAuthStorage,
} from '../../../session/cookie_splitter';

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
  public readonly type: string = AuthType.OPEN_ID;

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
  }

  public async init() {
    try {
      const response = await this.wreckClient.get(this.openIdConnectUrl);
      const payload = JSON.parse(response.payload as string);

      this.openIdAuthConfig.authorizationEndpoint = payload.authorization_endpoint;
      this.openIdAuthConfig.tokenEndpoint = payload.token_endpoint;
      this.openIdAuthConfig.endSessionEndpoint = payload.end_session_endpoint || undefined;

      this.createExtraStorage();

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
    } catch (error: any) {
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

  createExtraStorage() {
    // @ts-ignore
    const hapiServer: Server = this.sessionStorageFactory.asScoped({}).server;

    const extraCookiePrefix = this.config.openid!.extra_storage.cookie_prefix;
    const extraCookieSettings: ServerStateCookieOptions = {
      isSecure: this.config.cookie.secure,
      isSameSite: this.config.cookie.isSameSite,
      password: this.config.cookie.password,
      domain: this.config.cookie.domain,
      path: this.coreSetup.http.basePath.serverBasePath || '/',
      clearInvalid: false,
      isHttpOnly: true,
      ignoreErrors: true,
      encoding: 'iron', // Same as hapi auth cookie
    };

    for (let i = 1; i <= this.config.openid!.extra_storage.additional_cookies; i++) {
      hapiServer.states.add(extraCookiePrefix + i, extraCookieSettings);
    }
  }

  private getExtraAuthStorageOptions(): ExtraAuthStorageOptions {
    // If we're here, we will always have the openid configuration
    return {
      cookiePrefix: this.config.openid!.extra_storage.cookie_prefix,
      additionalCookies: this.config.openid!.extra_storage.additional_cookies,
      logger: this.logger,
    };
  }

  requestIncludesAuthInfo(request: OpenSearchDashboardsRequest): boolean {
    return request.headers.authorization ? true : false;
  }

  async getAdditionalAuthHeader(request: OpenSearchDashboardsRequest): Promise<any> {
    return {};
  }

  getCookie(request: OpenSearchDashboardsRequest, authInfo: any): SecuritySessionCookie {
    setExtraAuthStorage(
      request,
      request.headers.authorization as string,
      this.getExtraAuthStorageOptions()
    );

    return {
      username: authInfo.user_name,
      credentials: {
        authHeaderValueExtra: true,
      },
      authType: this.type,
      expiryTime: Date.now() + this.config.session.ttl,
    };
  }

  // TODO: Add token expiration check here
  async isValidCookie(
    cookie: SecuritySessionCookie,
    request: OpenSearchDashboardsRequest
  ): Promise<boolean> {
    if (
      cookie.authType !== this.type ||
      !cookie.username ||
      !cookie.expiryTime ||
      (!cookie.credentials?.authHeaderValue && !this.getExtraAuthStorageValue(request, cookie)) ||
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
            authHeaderValueExtra: true,
            refresh_token: refreshTokenResponse.refreshToken,
            expires_at: getExpirationDate(refreshTokenResponse), // expiresIn is in second
          };

          setExtraAuthStorage(
            request,
            `Bearer ${refreshTokenResponse.idToken}`,
            this.getExtraAuthStorageOptions()
          );

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
          location: `${this.coreSetup.http.basePath.serverBasePath}${OPENID_AUTH_LOGIN}?${nextUrl}`,
        },
      });
    } else {
      return response.unauthorized();
    }
  }

  getExtraAuthStorageValue(request: OpenSearchDashboardsRequest, cookie: SecuritySessionCookie) {
    let extraValue = '';
    if (!cookie.credentials?.authHeaderValueExtra) {
      return extraValue;
    }

    try {
      extraValue = getExtraAuthStorageValue(request, this.getExtraAuthStorageOptions());
    } catch (error) {
      this.logger.info(error);
    }

    return extraValue;
  }

  buildAuthHeaderFromCookie(
    cookie: SecuritySessionCookie,
    request: OpenSearchDashboardsRequest
  ): any {
    const header: any = {};
    if (cookie.credentials.authHeaderValueExtra) {
      try {
        const extraAuthStorageValue = this.getExtraAuthStorageValue(request, cookie);
        header.authorization = extraAuthStorageValue;
        return header;
      } catch (error) {
        this.logger.error(error);
        // TODO Re-throw?
        // throw error;
      }
    }
    const authHeaderValue = cookie.credentials?.authHeaderValue;
    if (authHeaderValue) {
      header.authorization = authHeaderValue;
    }
    return header;
  }
}
