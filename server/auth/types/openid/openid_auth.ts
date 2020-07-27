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
import {
  Logger,
  AuthenticationHandler,
  SessionStorageFactory,
  CoreSetup,
  IRouter,
  ILegacyClusterClient,
  KibanaRequest,
  LifecycleResponseFactory,
  AuthToolkit,
  IKibanaResponse,
} from 'kibana/server';
import { SecurityPluginConfigType } from '../../..';

import { SecuritySessionCookie } from '../../../session/security_cookie';
import { OpenIdAuthRoutes } from './routes';
import { SecurityClient } from '../../../backend/opendistro_security_client';
import { IAuthenticationType, AuthenticationType } from '../authentication_type';

export interface OpenIdAuthConfig {
  ca?: Buffer | undefined;
  // checkServerIdentity: (host: string, cert: any) => void;
  authorizationEndpoint?: string;
  tokenEndpoint?: string;
  endSessionEndpoint?: string;

  authHeaderName?: string;
}

export class OpenIdAuthentication extends AuthenticationType implements IAuthenticationType {
  public readonly type: string = 'openid';

  private openIdAuthConfig: OpenIdAuthConfig;
  private authHeaderName: string;
  private openIdConnectUrl: string;
  // private securityClient: SecurityClient;

  constructor(
    config: SecurityPluginConfigType,
    sessionStorageFactory: SessionStorageFactory<SecuritySessionCookie>,
    router: IRouter,
    esClient: ILegacyClusterClient,
    core: CoreSetup,
    logger: Logger
  ) {
    super(config, sessionStorageFactory, router, esClient, core, logger);
    this.openIdAuthConfig = {};

    if (this.config.openid?.root_ca) {
      this.openIdAuthConfig.ca = fs.readFileSync(this.config.openid.root_ca);
    }
    if (this.config.openid?.verify_hostnames) {
      logger.debug(`openId auth 'verify_hostnames' option is on.`);
    }

    this.authHeaderName = this.config.openid?.header || '';
    this.openIdAuthConfig.authHeaderName = this.authHeaderName;

    this.openIdConnectUrl = this.config.openid?.connect_url || '';
    // this.securityClient = new SecurityClient(this.esClient);

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
        this.coreSetup
      );
      routes.setupRoutes();
    } catch (error) {
      this.logger.error(error); // TODO: log more info
      throw new Error('Failed when trying to obtain the endpoints from your IdP');
    }
  }

  /*
  public authHandler: AuthenticationHandler = async (request, response, toolkit) => {
    let cookie: SecuritySessionCookie | null;
    try {
      cookie = await this.sessionStorageFactory.asScoped(request).get();
      if (!cookie) {
        return response.redirected({
          headers: {
            location: `${this.coreSetup.http.basePath.serverBasePath}/auth/openid/login`,
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
  */

  requestIncludesAuthInfo(request: KibanaRequest): boolean {
    return request.headers.authorization ? true : false;
  }

  getAdditionalAuthHeader(request: KibanaRequest): any {
    return {};
  }

  getCookie(request: KibanaRequest, authInfo: any): SecuritySessionCookie {
    return {
      username: authInfo.user_name,
      credentials: {
        authHeaderValue: request.headers.authorization,
      },
      authType: this.type,
      expiryTime: Date.now() + this.config.cookie.ttl,
    };
  }

  // TODO: Add token expiration check here
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
  ): IKibanaResponse {
    return response.redirected({
      headers: {
        location: `${this.coreSetup.http.basePath.serverBasePath}/auth/openid/login`,
      },
    });
  }

  buildAuthHeaderFromCookie(cookie: SecuritySessionCookie): any {
    const header: any = {};
    const authHeaderValue = cookie.credentials?.authHeaderValue;
    if (authHeaderValue) {
      header.authorization = authHeaderValue;
    }
    return header;
  }
}
