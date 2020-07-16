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

import {
  AuthenticationHandler,
  SessionStorageFactory,
  ILegacyClusterClient,
  IRouter,
  CoreSetup,
  Logger,
} from 'kibana/server';
import { SecurityPluginConfigType } from '../..';
import { SecuritySessionCookie } from '../../session/security_cookie';
import { SecurityClient } from '../../backend/opendistro_security_client';

export interface IAuthenticationType {
  type: string;
  authHandler: AuthenticationHandler;
}

export type IAuthHandlerConstructor = new (
  config: SecurityPluginConfigType,
  sessionStorageFactory: SessionStorageFactory<SecuritySessionCookie>,
  router: IRouter,
  esClient: ILegacyClusterClient,
  coreSetup: CoreSetup,
  logger: Logger
) => IAuthenticationType;

export { BasicAuthentication } from './basic/basic_auth';
export { JwtAuthentication } from './jwt/jwt_auth';
export { OpenIdAuthentication } from './openid/openid_auth';
export { ProxyAuthentication } from './proxy/proxy_auth';
export { SamlAuthentication } from './saml/saml_auth';

export abstract class AuthenticationType implements IAuthenticationType {
  private static readonly ROUTES_TO_IGNORE: string[] = [
    '/bundles/app/security-login/bootstrap.js', // TODO: remove/update the js file path
    '/bundles/app/security-customerror/bootstrap.js',
    '/api/core/capabilities', // FIXME: need to figureout how to bypass this API call
    '/app/login',
  ];

  private static readonly REST_API_CALL_HEADER = 'kbn-xsrf';

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
  }

  public authHandler: AuthenticationHandler = async (request, response, toolkit) => {
    const pathname = request.url.pathname;
    // allow requests to ignored routes
    if (pathname && AuthenticationType.ROUTES_TO_IGNORE.includes(pathname)) {
      return toolkit.authenticated();
    }
    // allow requests to routes that doesn't require authentication
    if (pathname && this.config.auth.unauthenticated_routes.indexOf(pathname) > -1) {
      // TODO: use kibana server user
      return toolkit.authenticated();
    }

    // if this is an REST API call, suppose the request includes necessary auth header
    // see https://www.elastic.co/guide/en/kibana/master/using-api.html
    if (request.headers[AuthenticationType.REST_API_CALL_HEADER] && (request.headers[AuthenticationType.REST_API_CALL_HEADER] as string).toLocaleLowerCase() === "true") {
      try {
        await this.securityClient.authinfo(request, {});
        return toolkit.authenticated();
      } catch (error) {
        return response.unauthorized();
      }
    }

    // if browser request, auth logic is:
    //   1. check if auth cookie is present, if no cookie, send to authentiation workflow
    //   2. veify whether auth cookie is valid, if not valid, send to authentication workflow
    //   3. if cookie is valid, pass to route handlers
    

    return toolkit.authenticated();
  };
}
