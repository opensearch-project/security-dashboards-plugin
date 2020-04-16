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

import { AuthenticationHandler, SessionStorageFactory, IRouter, IClusterClient, KibanaRequest } from "../../../../../../src/core/server";
import { SecurityPluginConfigType } from "../../..";
import { SecuritySessionCookie } from "../../../session/security_cookie";
import { CoreSetup } from "../../../../../../src/core/server";
import { cloneDeep } from 'lodash';
import { SecurityClient } from "../../../backend/opendistro_security_client";
import { BasicAuthRoutes } from "./routes";
import { format } from "url";
import { stringify } from 'querystring';

export class AuthConfig {
  constructor(
    public readonly authType: string,
    public readonly authHeaderName: string,
    public readonly allowedAdditionalAuthHeaders: string[],
    public readonly authenticateFunction: () => void,
    public readonly validateAvailableTenants: boolean,
    public readonly validateAvailableRoles: boolean) {
  }
}

export class BasicAuthentication {
  private static readonly AUTH_HEADER_NAME: string = 'authorization';
  private static readonly ALLOWED_ADDITIONAL_AUTH_HEADERS: string[] = ['security_impersonate_as'];
  private static readonly ROUTES_TO_IGNORE: string[] = [
    '/bundles/app/security-login/bootstrap.js',
    '/bundles/app/security-customerror/bootstrap.js',
    '/api/core/capabilities', // FIXME: need to figureout how to bypass this API call
  ];

  // private readonly unauthenticatedRoutes: string[];
  private readonly securityClient: SecurityClient;
  private readonly authConfig: AuthConfig;

  constructor(private readonly config: SecurityPluginConfigType,
    private readonly sessionStorageFactory: SessionStorageFactory<SecuritySessionCookie>,
    private readonly router: IRouter,
    private readonly esClient: IClusterClient,
    private readonly coreSetup: CoreSetup) {

    const multitenantEnabled = config.multitenancy.enabled;

    this.securityClient = new SecurityClient(this.esClient);
    this.authConfig = new AuthConfig('basicauth',
      BasicAuthentication.AUTH_HEADER_NAME,
      BasicAuthentication.ALLOWED_ADDITIONAL_AUTH_HEADERS,
      async () => { },
      multitenantEnabled,
      true);
    // this.unauthenticatedRoutes = this.config.auth.unauthenticated_routes;

    this.init();
  }

  private async init() {
    const routes = new BasicAuthRoutes(this.router, this.config, this.sessionStorageFactory, this.securityClient, this.authConfig, this.coreSetup);
    routes.setupRoutes();
  }

  private composeNextUrlQeuryParam(request: KibanaRequest): string {
    let url = cloneDeep(request.url);
    url.pathname = `${this.coreSetup.http.basePath.serverBasePath}${url.pathname}`;
    const nextUrl = format(url);
    return stringify({nextUrl});
  }

  /**
   * Basic Authentication auth handler. Registered to core.http if basic authentication is enabled.
   */
  authHandler: AuthenticationHandler = async (request, response, toolkit) => {
    
    if (BasicAuthentication.ROUTES_TO_IGNORE.includes(request.url.path)) {
      return toolkit.authenticated();
    }

    if (this.config.auth.unauthenticated_routes.indexOf(request.url.path) > -1) {
      // TODO: user kibana server user
      return toolkit.authenticated();
    }

    let cookie: SecuritySessionCookie = undefined;
    try {
      cookie = await this.sessionStorageFactory.asScoped(request).get();
      // TODO: need to do auth for each all?
      if (!cookie) {
        if (request.url.pathname === '/' || request.url.pathname.startsWith('/app')) {
          // requesting access to an application page, redirect to login
          const nextUrlParam = this.composeNextUrlQeuryParam(request);
          const redirectLocation = `${this.coreSetup.http.basePath.serverBasePath}/login?${nextUrlParam}`;
          return response.redirected({
            headers: {
              location: `${redirectLocation}`,
            }
          });
        }
        return response.unauthorized();
      }
      // set cookie to extend ttl
      cookie.expiryTime = Date.now() + this.config.cookie.ttl;
      this.sessionStorageFactory.asScoped(request).set(cookie);
      
      // pass credentials to request to Elasticsearch
      const credentials = cookie.credentials;
      return toolkit.authenticated({
        // state: credentials,
        requestHeaders: {
          'authorization': credentials.authHeaderValue,
        },
      });
    } catch (error) {
      // TODO: switch to logger
      console.log(`error: ${error}`);
      // TODO: redirect using response?
    }
  }
}
