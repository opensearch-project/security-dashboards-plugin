/*
 *   Copyright 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
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

// eslint-disable-next-line max-classes-per-file
import { cloneDeep } from 'lodash';
import { format } from 'url';
import { stringify } from 'querystring';
import {
  CoreSetup,
  SessionStorageFactory,
  IRouter,
  ILegacyClusterClient,
  KibanaRequest,
  Logger,
  LifecycleResponseFactory,
  AuthToolkit,
} from 'kibana/server';
import { KibanaResponse } from 'src/core/server/http/router';
import { SecurityPluginConfigType } from '../../..';
import { SecuritySessionCookie } from '../../../session/security_cookie';
import { BasicAuthRoutes } from './routes';
import { AuthenticationType } from '../authentication_type';
import { LOGIN_PAGE_URI } from '../../../../common';

// TODO: change to interface
export class AuthConfig {
  constructor(
    public readonly authType: string,
    public readonly authHeaderName: string,
    public readonly allowedAdditionalAuthHeaders: string[],
    public readonly authenticateFunction: () => void,
    public readonly validateAvailableTenants: boolean,
    public readonly validateAvailableRoles: boolean
  ) {}
}

export class BasicAuthentication extends AuthenticationType {
  private static readonly AUTH_HEADER_NAME: string = 'authorization';
  private static readonly ALLOWED_ADDITIONAL_AUTH_HEADERS: string[] = ['security_impersonate_as'];

  private readonly authConfig: AuthConfig;

  public readonly type: string = 'basicauth';

  constructor(
    config: SecurityPluginConfigType,
    sessionStorageFactory: SessionStorageFactory<SecuritySessionCookie>,
    router: IRouter,
    esClient: ILegacyClusterClient,
    coreSetup: CoreSetup,
    logger: Logger
  ) {
    super(config, sessionStorageFactory, router, esClient, coreSetup, logger);

    const multitenantEnabled = config.multitenancy?.enabled || false;
    this.authConfig = new AuthConfig(
      'basicauth',
      BasicAuthentication.AUTH_HEADER_NAME,
      BasicAuthentication.ALLOWED_ADDITIONAL_AUTH_HEADERS,
      async () => {},
      multitenantEnabled,
      true
    );

    this.init();
  }

  private async init() {
    const routes = new BasicAuthRoutes(
      this.router,
      this.config,
      this.sessionStorageFactory,
      this.securityClient,
      this.authConfig,
      this.coreSetup
    );
    routes.setupRoutes();
  }

  private composeNextUrlQeuryParam(request: KibanaRequest): string {
    const url = cloneDeep(request.url);
    url.pathname = `${this.coreSetup.http.basePath.serverBasePath}${url.pathname}`;
    const nextUrl = format(url);
    return stringify({ nextUrl });
  }

  // override functions inherited from AuthenticationType
  requestIncludesAuthInfo(request: KibanaRequest<unknown, unknown, unknown, any>): boolean {
    return request.headers[BasicAuthentication.AUTH_HEADER_NAME] ? true : false;
  }

  getAdditionalAuthHeader(request: KibanaRequest<unknown, unknown, unknown, any>) {
    return {};
  }

  getCookie(request: KibanaRequest, authInfo: any): SecuritySessionCookie {
    return {
      username: authInfo.user_name,
      credentials: {
        authHeaderValue: request.headers[BasicAuthentication.AUTH_HEADER_NAME],
      },
      authType: this.type,
      expiryTime: Date.now() + this.config.cookie.ttl,
    };
  }

  isValidCookie(cookie: SecuritySessionCookie): boolean {
    return (
      cookie.authType === this.type &&
      cookie.username &&
      cookie.expiryTime &&
      cookie.credentials?.authHeaderValue
    );
  }

  handleUnauthedRequest(
    request: KibanaRequest,
    response: LifecycleResponseFactory,
    toolkit: AuthToolkit
  ): KibanaResponse {
    // TODO: do the samething for other auth types? 
    // return 302 for /app
    const pathname = request.url.pathname || '';
    if (pathname.startsWith('/app/') || pathname === '/') {
      const nextUrlParam = this.composeNextUrlQeuryParam(request);
      const redirectLocation = `${this.coreSetup.http.basePath.serverBasePath}${LOGIN_PAGE_URI}?${nextUrlParam}`;
      return response.redirected({
        headers: {
          location: `${redirectLocation}`,
        },
      });
    } else {
      return response.unauthorized({
        body: `Authentication required`,
      })
    }

  }

  buildAuthHeaderFromCookie(cookie: SecuritySessionCookie): any {
    const headers: any = {};
    Object.assign(headers, { authorization: cookie.credentials?.authHeaderValue });
    return headers;
  }
}
