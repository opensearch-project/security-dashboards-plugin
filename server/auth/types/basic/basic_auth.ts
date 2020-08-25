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

export class BasicAuthentication extends AuthenticationType {
  private static readonly AUTH_HEADER_NAME: string = 'authorization';
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

    this.init();
  }

  private async init() {
    const routes = new BasicAuthRoutes(
      this.router,
      this.config,
      this.sessionStorageFactory,
      this.securityClient,
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
    if (
      this.config.auth.anonymous_auth_enabled &&
      authInfo.user_name === 'opendistro_security_anonymous'
    ) {
      return {
        username: authInfo.user_name,
        authType: this.type,
        expiryTime: Date.now() + this.config.cookie.ttl,
        isAnonymousAuth: true,
      };
    }
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
      cookie.expiryTime &&
      ((cookie.username && cookie.credentials?.authHeaderValue) ||
        (this.config.auth.anonymous_auth_enabled && cookie.isAnonymousAuth))
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
      });
    }
  }

  buildAuthHeaderFromCookie(cookie: SecuritySessionCookie): any {
    if (this.config.auth.anonymous_auth_enabled && cookie.isAnonymousAuth) {
      return {};
    }
    const headers: any = {};
    Object.assign(headers, { authorization: cookie.credentials?.authHeaderValue });
    return headers;
  }
}
