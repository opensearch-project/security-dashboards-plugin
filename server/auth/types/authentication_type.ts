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
  AuthToolkit,
  LifecycleResponseFactory,
  KibanaRequest,
  IKibanaResponse,
  AuthResult,
} from 'kibana/server';
import { SecurityPluginConfigType } from '../..';
import { SecuritySessionCookie } from '../../session/security_cookie';
import { SecurityClient } from '../../backend/opendistro_security_client';
import {
  isMultitenantPath,
  resolveTenant,
  isValidTenent,
} from '../../multitenancy/tenant_resolver';
import { UnauthenticatedError } from '../../errors';

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

export abstract class AuthenticationType implements IAuthenticationType {
  protected static readonly ROUTES_TO_IGNORE: string[] = [
    '/api/core/capabilities', // FIXME: need to figureout how to bypass this API call
    '/app/login',
  ];

  protected static readonly REST_API_CALL_HEADER = 'kbn-xsrf';

  public type: string;

  protected readonly securityClient: SecurityClient;

  constructor(
    protected readonly config: SecurityPluginConfigType,
    protected readonly sessionStorageFactory: SessionStorageFactory<SecuritySessionCookie>,
    protected readonly router: IRouter,
    protected readonly esClient: ILegacyClusterClient,
    protected readonly coreSetup: CoreSetup,
    protected readonly logger: Logger
  ) {
    this.securityClient = new SecurityClient(esClient);
    this.type = '';
  }

  public authHandler: AuthenticationHandler = async (request, response, toolkit) => {
    // allow access to assets
    if (request.url.pathname && request.url.pathname.startsWith('/bundles/')) {
      return toolkit.authenticated();
    }

    // skip auth for APIs that do not require auth
    if (this.authNotRequired(request)) {
      return toolkit.authenticated();
    }

    // if browser request, auth logic is:
    //   1. check if request includes auth header or paramter(e.g. jwt in url params) is present, if so, authenticate with auth header.
    //   2. if auth header not present, check if auth cookie is present, if no cookie, send to authentication workflow
    //   3. verify whether auth cookie is valid, if not valid, send to authentication workflow
    //   4. if cookie is valid, pass to route handlers
    const authHeaders = {};
    let cookie: SecuritySessionCookie | null | undefined;
    let authInfo: any | undefined;
    // if this is an REST API call, suppose the request includes necessary auth header
    // see https://www.elastic.co/guide/en/kibana/master/using-api.html
    if (this.requestIncludesAuthInfo(request)) {
      try {
        const additonalAuthHeader = this.getAdditionalAuthHeader(request);
        Object.assign(authHeaders, additonalAuthHeader);
        authInfo = await this.securityClient.authinfo(request, additonalAuthHeader);
        cookie = this.getCookie(request, authInfo);
        this.sessionStorageFactory.asScoped(request).set(cookie);
      } catch (error) {
        return response.unauthorized({
          body: error.message,
        });
      }
    } else {
      // no auth header in request, try cookie
      try {
        cookie = await this.sessionStorageFactory.asScoped(request).get();
      } catch (error) {
        this.logger.error(`Error parsing cookie: ${error.message}`);
        cookie = undefined;
      }

      if (!cookie || !(await this.isValidCookie(cookie))) {
        // clear cookie
        this.sessionStorageFactory.asScoped(request).clear();
        // send to auth workflow
        return this.handleUnauthedRequest(request, response, toolkit);
      }

      // extend cookie expiration time
      cookie!.expiryTime = Date.now() + this.config.cookie.ttl;
      this.sessionStorageFactory.asScoped(request).set(cookie!);

      // cookie is valid
      // build auth header
      const authHeadersFromCookie = this.buildAuthHeaderFromCookie(cookie!);
      Object.assign(authHeaders, authHeadersFromCookie);
      const additonalAuthHeader = this.getAdditionalAuthHeader(request);
      Object.assign(authHeaders, additonalAuthHeader);
    }

    // resolve tenant if necessary
    if (this.config.multitenancy?.enabled && isMultitenantPath(request)) {
      try {
        const tenant = await this.resolveTenant(request, cookie!, authHeaders, authInfo);
        // return 401 if no tenant available
        if (!isValidTenent(tenant)) {
          return response.badRequest({
            body:
              'No available tenant for current user, please reach out to your system administrator',
          });
        }
        // set tenant in header
        Object.assign(authHeaders, { securitytenant: tenant });

        // set tenant to cookie
        if (tenant !== cookie!.tenant) {
          cookie!.tenant = tenant;
          this.sessionStorageFactory.asScoped(request).set(cookie!);
        }
      } catch (error) {
        this.logger.error(`Failed to resolve user tenant: ${error}`);
        if (error instanceof UnauthenticatedError) {
          return this.handleUnauthedRequest(request, response, toolkit);
        }
        throw error;
      }
    }

    return toolkit.authenticated({
      requestHeaders: authHeaders,
    });
  };

  authNotRequired(request: KibanaRequest): boolean {
    const pathname = request.url.pathname;
    if (!pathname) {
      return false;
    }
    // allow requests to ignored routes
    if (AuthenticationType.ROUTES_TO_IGNORE.includes(pathname!)) {
      return true;
    }
    // allow requests to routes that doesn't require authentication
    if (this.config.auth.unauthenticated_routes.indexOf(pathname!) > -1) {
      // TODO: use kibana server user
      return true;
    }
    return false;
  }

  async resolveTenant(
    request: KibanaRequest,
    cookie: SecuritySessionCookie,
    authHeader: any,
    authInfo: any
  ): Promise<string | undefined> {
    if (!authInfo) {
      try {
        authInfo = await this.securityClient.authinfo(request, authHeader);
      } catch (error) {
        throw new UnauthenticatedError(error);
      }
    }

    const selectedTenant = resolveTenant(
      request,
      authInfo.user_name,
      authInfo.tenants,
      this.config,
      cookie
    );
    return selectedTenant;
  }

  // abstract functions for concrete auth types to implement
  protected abstract requestIncludesAuthInfo(request: KibanaRequest): boolean;
  protected abstract getAdditionalAuthHeader(request: KibanaRequest): any;
  protected abstract getCookie(request: KibanaRequest, authInfo: any): SecuritySessionCookie;
  protected abstract async isValidCookie(cookie: SecuritySessionCookie): Promise<boolean>;
  protected abstract handleUnauthedRequest(
    request: KibanaRequest,
    response: LifecycleResponseFactory,
    toolkit: AuthToolkit
  ): IKibanaResponse | AuthResult;
  protected abstract buildAuthHeaderFromCookie(cookie: SecuritySessionCookie): any;
}
