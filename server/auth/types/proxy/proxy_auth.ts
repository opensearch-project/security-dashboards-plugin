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

import { SecurityPluginConfigType } from '../../..';
import {
  SessionStorageFactory,
  IRouter,
  IClusterClient,
  CoreSetup,
  AuthenticationHandler,
} from '../../../../../../src/core/server';
import { assign, get } from 'lodash';
import { SecuritySessionCookie } from '../../../session/security_cookie';
import { SecurityClient } from '../../../backend/opendistro_security_client';
import { User } from '../../user';
import { ProxyAuthRoutes } from './routes';

export class ProxyAuthentication {
  private readonly authType: string = 'proxycache';
  private readonly securityClient: SecurityClient;

  private readonly userHeaderName: string;
  private readonly roleHeaderName: string;

  constructor(
    private readonly config: SecurityPluginConfigType,
    private readonly sessionStorageFactory: SessionStorageFactory<SecuritySessionCookie>,
    private readonly router: IRouter,
    private readonly esClient: IClusterClient,
    private readonly coreSetup: CoreSetup
  ) {
    this.securityClient = new SecurityClient(this.esClient);

    this.userHeaderName = this.config.proxycache?.user_header?.toLowerCase() || '';
    if (!this.userHeaderName) {
      throw new Error('User header is mandatory for proxy auth.');
    }
    this.roleHeaderName = this.config.proxycache?.roles_header?.toLowerCase() || '';

    this.setupRoutes();
  }

  authHandler: AuthenticationHandler = async (request, response, toolkit) => {
    let cookie = await this.sessionStorageFactory.asScoped(request).get();
    const authHeaders: any = {};

    const customProxyHeader = this.config.proxycache?.proxy_header;
    if (customProxyHeader && !request.headers[customProxyHeader]) {
      const configProxyIp = this.config.proxycache?.proxy_header_ip;
      authHeaders[customProxyHeader] = `${configProxyIp}`; // TODO: check how to get remoteIp
    }

    if (cookie) {
      if (get(cookie.credentials, this.userHeaderName)) {
        authHeaders[this.userHeaderName] = request.headers[this.userHeaderName];
        authHeaders[this.roleHeaderName] = request.headers[this.roleHeaderName];

        cookie.expiryTime = Date.now() + this.config.cookie.ttl;
        this.sessionStorageFactory.asScoped(request).set(cookie);
        return toolkit.authenticated({
          requestHeaders: authHeaders,
        });
      } else if (get(cookie.credentials, 'authorization')) {
        authHeaders['authorization'] = get(cookie.credentials, 'authorization');
        return toolkit.authenticated({
          requestHeaders: authHeaders,
        });
      }
    }

    if (request.headers[`${this.userHeaderName}`]) {
      authHeaders[this.userHeaderName] = request.headers[this.userHeaderName];
      authHeaders['x-forwarded-for'] = request.headers['x-forwarded-for'];
      if (this.roleHeaderName && request.headers[this.roleHeaderName]) {
        authHeaders[this.roleHeaderName] = request.headers[this.roleHeaderName];
      }

      let user: User;
      try {
        user = await this.securityClient.authenticateWithHeaders(request, {}, authHeaders);
        const cookie: SecuritySessionCookie = {
          username: user.username,
          credentials: {
            [this.userHeaderName]: request.headers[this.userHeaderName],
            'x-forwarded-for': request.headers['x-forwarded-for'],
          },
          authType: 'proxycache',
          isAnonymousAuth: false,
          expiryTime: Date.now() + this.config.cookie.ttl,
        };
        if (this.roleHeaderName) {
          cookie.credentials[this.roleHeaderName] = request.headers[this.roleHeaderName];
        }
        this.sessionStorageFactory.asScoped(request).set(cookie);
      } catch (error) {
        const loginEndpoint = this.config.proxycache?.login_endpoint;
        if (loginEndpoint) {
          return toolkit.redirected({
            location: loginEndpoint,
          });
        } else {
          return toolkit.notHandled(); // TODO: redirect to error page?
        }
      }

      return toolkit.authenticated({
        requestHeaders: authHeaders,
      });
    } else if (request.headers['authorization']) {
      const authHeaders: any = {
        authorization: request.headers['authorization'],
      };
      return toolkit.authenticated({
        requestHeaders: authHeaders,
      });
    }
    return toolkit.notHandled();
  };

  private setupRoutes() {
    const routes = new ProxyAuthRoutes(
      this.router,
      this.config,
      this.sessionStorageFactory,
      this.securityClient,
      this.coreSetup
    );
    routes.setupRoutes();
  }
}
