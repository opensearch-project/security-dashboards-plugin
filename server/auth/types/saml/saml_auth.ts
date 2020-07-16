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
import { SecurityPluginConfigType } from '../../..';
import {
  AuthenticationHandler,
  SessionStorageFactory,
  IRouter,
  ILegacyClusterClient,
  KibanaRequest,
  AuthToolkit,
  Logger,
} from '../../../../../../src/core/server';
import { SecuritySessionCookie } from '../../../session/security_cookie';
import { CoreSetup } from '../../../../../../src/core/server';
import { SecurityClient } from '../../../backend/opendistro_security_client';
import { SamlAuthRoutes } from './routes';
import { IAuthenticationType } from '../authentication_type';

export class SamlAuthentication implements IAuthenticationType {
  public static readonly AUTH_HEADER_NAME = 'authorization';

  public readonly type: string = 'saml';

  private readonly securityClient: SecurityClient;

  constructor(
    private readonly config: SecurityPluginConfigType,
    private readonly sessionStorageFactory: SessionStorageFactory<SecuritySessionCookie>,
    private readonly router: IRouter,
    private readonly esClient: ILegacyClusterClient,
    private readonly coreSetup: CoreSetup,
    private readonly logger: Logger
  ) {
    this.securityClient = new SecurityClient(esClient);
    this.setupRoutes();
  }

  authHandler: AuthenticationHandler = async (request, response, toolkit) => {
    let cookie;
    try {
      cookie = await this.sessionStorageFactory.asScoped(request).get();
    } catch (error) {
      this.logger.error(`Failed to parse cookie due to: ${error}`);
      toolkit.notHandled();
    }

    if (cookie) {
      // extend session time
      cookie.expiryTime = Date.now() + this.config.cookie.ttl;
      this.sessionStorageFactory.asScoped(request).set(cookie);

      const authHeaderValue = cookie.credentials?.authHeaderValue;
      if (!authHeaderValue) {
        return this.redirectToLoginUri(request, toolkit);
      }

      const header: any = {};
      header[SamlAuthentication.AUTH_HEADER_NAME] = authHeaderValue;
      return toolkit.authenticated({
        requestHeaders: header,
      });
    }

    // no valid cookie, check auth header
    const authHeaderValue = request.headers[SamlAuthentication.AUTH_HEADER_NAME];
    if (authHeaderValue && typeof authHeaderValue === 'string') {
      try {
        const user = await this.securityClient.authenticateWithHeader(
          request,
          SamlAuthentication.AUTH_HEADER_NAME,
          authHeaderValue
        );

        cookie = {
          username: user.username,
          credentials: {
            authHeaderValue,
          },
          authType: this.type,
          expiryTime: Date.now() + this.config.cookie.ttl,
        };
        this.sessionStorageFactory.asScoped(request).set(cookie);
        const header: any = {};
        header[SamlAuthentication.AUTH_HEADER_NAME] = authHeaderValue;
        return toolkit.authenticated({
          requestHeaders: header,
        });
      } catch (error) {
        response.unauthorized();
      }
    }

    return this.redirectToLoginUri(request, toolkit);
  };

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
}
