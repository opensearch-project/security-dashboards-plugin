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
import { Server, ServerStateCookieOptions } from '@hapi/hapi';
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
import { AuthType } from '../../../../common';

import { setExtraAuthStorage, getExtraAuthStorageValue } from '../../../session/cookie_splitter';

export class SamlAuthentication extends AuthenticationType {
  public static readonly AUTH_HEADER_NAME = 'authorization';

  public readonly type: string = 'saml';

  private readonly extraCookiePrefix: string = ''; // TODO Why a default value?
  private readonly useAdditionalCookies: boolean = false;

  constructor(
    config: SecurityPluginConfigType,
    sessionStorageFactory: SessionStorageFactory<SecuritySessionCookie>,
    router: IRouter,
    esClient: ILegacyClusterClient,
    coreSetup: CoreSetup,
    logger: Logger
  ) {
    super(config, sessionStorageFactory, router, esClient, coreSetup, logger);

    // Use extra cookie to store the SAML token?
    if (this.config.saml?.extra_storage.additional_cookies > 0) {
      this.useAdditionalCookies = true;

      // @ts-ignore
      const hapiServer: Server = this.sessionStorageFactory.asScoped({}).server;

      this.extraCookiePrefix = this.config.saml.extra_storage.cookie_prefix;
      const extraCookieSettings: ServerStateCookieOptions = {
        isSecure: config.cookie.secure,
        isSameSite: config.cookie.isSameSite,
        password: config.cookie.password,
        domain: config.cookie.domain,
        path: this.coreSetup.http.basePath.serverBasePath || '/',
        clearInvalid: false,
        isHttpOnly: true,
        encoding: 'iron', // Same as hapi auth cookie
      };

      for (let i = 1; i <= this.config.saml.extra_storage.additional_cookies; i++) {
        hapiServer.states.add(this.extraCookiePrefix + '_' + i, extraCookieSettings);
      }
    }
  }

  private generateNextUrl(request: OpenSearchDashboardsRequest): string {
    const path =
      this.coreSetup.http.basePath.serverBasePath +
      (request.url.pathname || '/app/opensearch-dashboards');
    return escape(path);
  }

  // Check if we can get the previous tenant information from the expired cookie.
  private redirectSAMlCapture = (request: OpenSearchDashboardsRequest, toolkit: AuthToolkit) => {
    const nextUrl = this.generateNextUrl(request);
    const clearOldVersionCookie = clearOldVersionCookieValue(this.config);
    return toolkit.redirected({
      location: `${this.coreSetup.http.basePath.serverBasePath}/auth/saml/captureUrlFragment?nextUrl=${nextUrl}`,
      'set-cookie': clearOldVersionCookie,
    });
  };

  public async init() {
    const samlAuthRoutes = new SamlAuthRoutes(
      this.router,
      this.config,
      this.sessionStorageFactory,
      this.securityClient,
      this.coreSetup
    );
    samlAuthRoutes.setupRoutes(this.extraCookiePrefix);
  }

  requestIncludesAuthInfo(request: OpenSearchDashboardsRequest): boolean {
    return request.headers[SamlAuthentication.AUTH_HEADER_NAME] ? true : false;
  }

  async getAdditionalAuthHeader(request: OpenSearchDashboardsRequest): Promise<any> {
    return {};
  }

  getCookie(request: OpenSearchDashboardsRequest, authInfo: any): SecuritySessionCookie {
    const authorizationHeaderValue: string = request.headers[
      SamlAuthentication.AUTH_HEADER_NAME
      ] as string;

    setExtraAuthStorage(request, authorizationHeaderValue, {
      cookiePrefix: this.config.saml!.extra_storage.cookie_prefix,
      additionalCookies: this.config.saml!.extra_storage.additional_cookies,
    });

    return {
      username: authInfo.user_name,
      credentials: {
        authHeaderValueExtra: true,
      },
      authType: AuthType.SAML,
      expiryTime: Date.now() + this.config.session.ttl,
    };
  }

  // Can be improved to check if the token is expiring.
  async isValidCookie(
    cookie: SecuritySessionCookie,
    request: OpenSearchDashboardsRequest
  ): Promise<boolean> {
    return (
      cookie.authType === AuthType.SAML &&
      cookie.username &&
      cookie.expiryTime &&
      (cookie.credentials?.authHeaderValue || this.getExtraAuthStorageValue(request, cookie))
    );
  }

  handleUnauthedRequest(
    request: OpenSearchDashboardsRequest,
    response: LifecycleResponseFactory,
    toolkit: AuthToolkit
  ): IOpenSearchDashboardsResponse | AuthResult {
    if (this.isPageRequest(request)) {
      return this.redirectSAMlCapture(request, toolkit);
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
      extraValue = getExtraAuthStorageValue(request, {
        cookiePrefix: this.extraCookiePrefix,
        additionalCookies: this.config.saml!.extra_storage.additional_cookies,
      });
    } catch (error) {
      this.logger.info(error);
    }

    return extraValue;
  }

  buildAuthHeaderFromCookie(
    cookie: SecuritySessionCookie,
    request: OpenSearchDashboardsRequest
  ): any {
    const headers: any = {};

    if (cookie.credentials?.authHeaderValueExtra) {
      try {
        const extraAuthStorageValue = this.getExtraAuthStorageValue(request, cookie);
        headers[SamlAuthentication.AUTH_HEADER_NAME] = extraAuthStorageValue;
      } catch (error) {
        this.logger.error(error);
        // @todo Re-throw?
        // throw error;
      }
    } else {
      headers[SamlAuthentication.AUTH_HEADER_NAME] = cookie.credentials?.authHeaderValue;
    }

    return headers;
  }
}
