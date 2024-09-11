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
import { ServerStateCookieOptions } from '@hapi/hapi';
import { SecurityPluginConfigType } from '../../..';
import { SecuritySessionCookie } from '../../../session/security_cookie';
import { AuthenticationType } from '../authentication_type';
import { JwtAuthRoutes } from './routes';
import {
  ExtraAuthStorageOptions,
  getExtraAuthStorageValue,
  setExtraAuthStorage,
} from '../../../session/cookie_splitter';
import { getExpirationDate } from './jwt_helper';

export const JWT_DEFAULT_EXTRA_STORAGE_OPTIONS: ExtraAuthStorageOptions = {
  cookiePrefix: 'security_authentication_jwt',
  additionalCookies: 5,
};

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
    this.createExtraStorage();
    const routes = new JwtAuthRoutes(this.router, this.sessionStorageFactory, this.config);
    routes.setupRoutes();
  }

  createExtraStorage() {
    // @ts-ignore
    const hapiServer: Server = this.sessionStorageFactory.asScoped({}).server;

    const { cookiePrefix, additionalCookies } = this.getExtraAuthStorageOptions();
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

    for (let i = 1; i <= additionalCookies; i++) {
      hapiServer.states.add(cookiePrefix + i, extraCookieSettings);
    }
  }

  private getExtraAuthStorageOptions(): ExtraAuthStorageOptions {
    const extraAuthStorageOptions: ExtraAuthStorageOptions = {
      cookiePrefix:
        this.config.jwt?.extra_storage.cookie_prefix ||
        JWT_DEFAULT_EXTRA_STORAGE_OPTIONS.cookiePrefix,
      additionalCookies:
        this.config.jwt?.extra_storage.additional_cookies ||
        JWT_DEFAULT_EXTRA_STORAGE_OPTIONS.additionalCookies,
      logger: this.logger,
    };

    return extraAuthStorageOptions;
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
    // TODO: This logic is only applicable for JWT auth type
    setExtraAuthStorage(
      request,
      this.getBearerToken(request) || '',
      this.getExtraAuthStorageOptions()
    );

    return {
      username: authInfo.user_name,
      credentials: {
        authHeaderValueExtra: true,
      },
      authType: this.type,
      expiryTime: getExpirationDate(
        this.getBearerToken(request),
        Date.now() + this.config.session.ttl
      ),
    };
  }

  async isValidCookie(
    cookie: SecuritySessionCookie,
    request: OpenSearchDashboardsRequest
  ): Promise<boolean> {
    const hasAuthHeaderValue =
      cookie.credentials?.authHeaderValue || this.getExtraAuthStorageValue(request, cookie);
    return (
      cookie.authType === this.type && cookie.username && cookie.expiryTime && hasAuthHeaderValue
    );
  }

  getKeepAliveExpiry(cookie: SecuritySessionCookie, request: OpenSearchDashboardsRequest): number {
    return getExpirationDate(
      this.buildAuthHeaderFromCookie(cookie, request)[this.authHeaderName],
      Date.now() + this.config.session.ttl
    );
  }

  handleUnauthedRequest(
    request: OpenSearchDashboardsRequest,
    response: LifecycleResponseFactory,
    toolkit: AuthToolkit
  ): IOpenSearchDashboardsResponse {
    return response.unauthorized();
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
      }
    }
    const authHeaderValue = cookie.credentials?.authHeaderValue;
    if (authHeaderValue) {
      header[this.authHeaderName] = authHeaderValue;
    }
    return header;
  }
}
