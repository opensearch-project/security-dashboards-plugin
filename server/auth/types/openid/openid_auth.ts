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

import * as fs from 'fs';
import wreck from '@hapi/wreck';
import { SecurityPluginConfigType } from '../../..';

import {
  Logger,
  AuthenticationHandler,
  SessionStorageFactory,
  CoreSetup,
  IRouter,
  IClusterClient,
} from '../../../../../../src/core/server';
import { SecuritySessionCookie } from '../../../session/security_cookie';
import { OpenIdAuthRoutes } from './routes';
import { SecurityClient } from '../../../backend/opendistro_security_client';
import { IAuthenticationType } from '../authentication_type';

export interface OpenIdAuthConfig {
  ca?: Buffer | undefined;
  // checkServerIdentity: (host: string, cert: any) => void;
  authorizationEndpoint?: string;
  tokenEndpoint?: string;
  endSessionEndpoint?: string;

  authHeaderName?: string;
}

export class OpenIdAuthentication implements IAuthenticationType {
  private openIdAuthConfig: OpenIdAuthConfig;
  private authHeaderName: string;
  private openIdConnectUrl: string;
  private securityClient: SecurityClient;

  constructor(
    private readonly config: SecurityPluginConfigType,
    private readonly sessionStorageFactory: SessionStorageFactory<SecuritySessionCookie>,
    private readonly router: IRouter,
    private readonly esClient: IClusterClient,
    private readonly coreSetup: CoreSetup,
    private readonly logger: Logger
  ) {
    this.openIdAuthConfig = {};

    if (this.config.openid?.root_ca) {
      this.openIdAuthConfig.ca = fs.readFileSync(this.config.openid.root_ca);
    }
    if (this.config.openid?.verify_hostnames) {
      log.debug(`openId auth 'verify_hostnames' option is on.`);
    }

    this.authHeaderName = this.config.openid?.header || '';
    this.openIdAuthConfig.authHeaderName = this.authHeaderName;

    this.openIdConnectUrl = this.config.openid?.connect_url || '';
    this.securityClient = new SecurityClient(this.esClient);

    this.init();
  }

  private async init() {
    try {
      const response = await wreck.get(this.openIdConnectUrl);
      const payload = JSON.parse(response.payload as string);

      this.openIdAuthConfig.authorizationEndpoint = payload.authorization_endpoint;
      this.openIdAuthConfig.tokenEndpoint = payload.token_endpoint;
      this.openIdAuthConfig.endSessionEndpoint = payload.end_session_endpoint || undefined;

      const routes = new OpenIdAuthRoutes(
        this.router,
        this.config,
        this.sessionStorageFactory,
        this.openIdAuthConfig,
        this.securityClient,
        this.core
      );
      routes.setupRoutes();
    } catch (error) {
      this.log.error(error); // TODO: log more info
      throw new Error('Failed when trying to obtain the endpoints from your IdP');
    }
  }

  public authHandler: AuthenticationHandler = async (request, response, toolkit) => {
    let cookie: SecuritySessionCookie | null;
    try {
      cookie = await this.sessionStorageFactory.asScoped(request).get();
      if (!cookie) {
        return response.redirected({
          headers: {
            location: `${this.core.http.basePath.serverBasePath}/auth/openid/login`,
          },
        });
      }
      // TODO: make a call to authinfo (securityClient.authenticateWithHeader) to validate credentials
      cookie.expiryTime = Date.now() + this.config.cookie.ttl;
      this.sessionStorageFactory.asScoped(request).set(cookie);

      const headers: any = {};
      if (cookie.credentials?.authHeaderValue) {
        const authHeaderName: string = this.config.openid?.header.toLowerCase() || 'authorization';
        headers[authHeaderName] = cookie.credentials.authHeaderValue;
        // need to implement token refresh when id token is expired
        return toolkit.authenticated({
          requestHeaders: headers,
        });
      } else {
        return toolkit.notHandled();
      }

      // extract credentials from cookie
    } catch (error) {
      console.log(error); // FIXME: log and handle properly
    }
    return toolkit.authenticated();
  };
}
