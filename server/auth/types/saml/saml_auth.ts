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

import { escape } from 'querystring';
import { CoreSetup } from 'kibana/server';
import { SecurityPluginConfigType } from '../../..';
import {
  SessionStorageFactory,
  IRouter,
  ILegacyClusterClient,
  KibanaRequest,
  AuthToolkit,
  Logger,
  LifecycleResponseFactory,
  IKibanaResponse,
  AuthResult,
} from '../../../../../../src/core/server';
import { SecuritySessionCookie } from '../../../session/security_cookie';
import { SamlAuthRoutes } from './routes';
import { AuthenticationType } from '../authentication_type';

export class SamlAuthentication extends AuthenticationType {
  public static readonly AUTH_HEADER_NAME = 'authorization';

  public readonly type: string = 'saml';

  // private readonly securityClient: SecurityClient;

  constructor(
    config: SecurityPluginConfigType,
    sessionStorageFactory: SessionStorageFactory<SecuritySessionCookie>,
    router: IRouter,
    esClient: ILegacyClusterClient,
    coreSetup: CoreSetup,
    logger: Logger
  ) {
    super(config, sessionStorageFactory, router, esClient, coreSetup, logger);
    // this.securityClient = new SecurityClient(esClient);
    this.setupRoutes();
  }

  private generateNextUrl(request: KibanaRequest): string {
    const path = request.url.path || `${this.coreSetup.http.basePath.serverBasePath}/app/kibana`;
    return escape(path);
  }

  private redirectToLoginUri(request: KibanaRequest, toolkit: AuthToolkit) {
    const nextUrl = this.generateNextUrl(request);
    return toolkit.redirected({
      location: `${this.coreSetup.http.basePath.serverBasePath}/auth/saml/login?nextUrl=${nextUrl}`,
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

  requestIncludesAuthInfo(request: KibanaRequest): boolean {
    return request.headers[SamlAuthentication.AUTH_HEADER_NAME] ? true : false;
  }

  getAdditionalAuthHeader(request: KibanaRequest): any {
    return {};
  }

  getCookie(request: KibanaRequest, authInfo: any): SecuritySessionCookie {
    return {
      username: authInfo.user_name,
      credentials: {
        authHeaderValue: request.headers[SamlAuthentication.AUTH_HEADER_NAME],
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

  redirectToAuth(
    request: KibanaRequest,
    response: LifecycleResponseFactory,
    toolkit: AuthToolkit
  ): IKibanaResponse | AuthResult {
    return this.redirectToLoginUri(request, toolkit);
  }

  buildAuthHeaderFromCookie(cookie: SecuritySessionCookie): any {
    const headers: any = {};
    headers[SamlAuthentication.AUTH_HEADER_NAME] = cookie.credentials?.authHeaderValue;
    return headers;
  }
}
