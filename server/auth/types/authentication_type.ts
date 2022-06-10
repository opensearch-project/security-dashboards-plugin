/*
 *   Copyright OpenSearch Contributors
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
  OpenSearchDashboardsRequest,
  IOpenSearchDashboardsResponse,
  AuthResult,
} from 'opensearch-dashboards/server';
import { SecurityPluginConfigType } from '../..';
import { SecuritySessionCookie } from '../../session/security_cookie';
import { SecurityClient } from '../../backend/opensearch_security_client';
import {
  isMultitenantPath,
  resolveTenant,
  isValidTenant,
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
  protected static readonly ROUTES_TO_IGNORE: string[] = ['/app/login'];

  // Workaround: Some routes are called from pages that do not
  // have / require a logged in user, like "login", "logout" and "customerror".
  // However, these routes can also be called from "within" Dashboards,
  // for example on app/home, where we need an authenticated user.
  // As a workaround, exclude these routes for login, logout etc.,
  // but let them pass on other pages, like app/home
  protected static readonly ROUTES_TO_IGNORE_FROM_UNAUTHENTICATED_PAGES: string[] = [
    '/api/core/capabilities',
  ];

  // On these pages, ignore the ROUTES_TO_IGNORE_FROM_UNAUTHENTICATED_PAGES routes
  protected static readonly UNAUTHENTICATED_PAGES: string[] = [
    '/app/login',
    '/app/logout',
    '/app/customerror',
  ];

  protected static readonly REST_API_CALL_HEADER = 'osd-xsrf';

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
    // see https://www.elastic.co/guide/en/opensearch-dashboards/master/using-api.html
    if (this.requestIncludesAuthInfo(request)) {
      try {
        const additonalAuthHeader = this.getAdditionalAuthHeader(request);
        Object.assign(authHeaders, additonalAuthHeader);
        authInfo = await this.securityClient.authinfo(request, additonalAuthHeader);
        cookie = await this.getCookie(request, authInfo);

        // set tenant from cookie if exist
        const browserCookie = await this.sessionStorageFactory.asScoped(request).get();
        if (browserCookie && isValidTenant(browserCookie.tenant)) {
          cookie.tenant = browserCookie.tenant;
        }

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

        // for assets, we can still pass it to resource handler as notHandled.
        // marking it as authenticated may result in login pop up when auth challenge
        // is enabled.
        if (request.url.pathname && request.url.pathname.startsWith('/bundles/')) {
          return toolkit.notHandled();
        }

        // send to auth workflow
        return this.handleUnauthedRequest(request, response, toolkit);
      }

      // extend session expiration time
      if (this.config.session.keepalive) {
        cookie!.expiryTime = Date.now() + this.config.session.ttl;
        this.sessionStorageFactory.asScoped(request).set(cookie!);
      }
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
        if (!isValidTenant(tenant)) {
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
          if (request.url.pathname && request.url.pathname.startsWith('/bundles/')) {
            return toolkit.notHandled();
          }
          this.sessionStorageFactory.asScoped(request).clear();
          return this.handleUnauthedRequest(request, response, toolkit);
        }
        throw error;
      }
    }

    return toolkit.authenticated({
      requestHeaders: authHeaders,
    });
  };

  authNotRequired(request: OpenSearchDashboardsRequest): boolean {
    const pathname = request.url.pathname;
    const referer = request.headers.referer || '';

    if (!pathname) {
      return false;
    }

    // exclude some routes from authentication only if they are called from pages
    // where we do not have an authenticated user, like login. If called from any other
    // page, run the authentication logic. This is to ensure that the /api/core/capabilities
    // route gets authenticated when called from e.g. /app/home, but not on /login.
    if (AuthenticationType.UNAUTHENTICATED_PAGES.some((path) => referer.includes(path))) {
      if (AuthenticationType.ROUTES_TO_IGNORE_FROM_UNAUTHENTICATED_PAGES.includes(pathname)) {
        return true;
      }
    }

    // allow requests to ignored routes
    if (AuthenticationType.ROUTES_TO_IGNORE.includes(pathname!)) {
      return true;
    }

    // allow requests to routes that doesn't require authentication
    if (this.config.auth.unauthenticated_routes.indexOf(pathname!) > -1) {
      // TODO: use opensearch-dashboards server user
      return true;
    }
    return false;
  }

  async resolveTenant(
    request: OpenSearchDashboardsRequest,
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
      authInfo.roles,
      authInfo.tenants,
      this.config,
      cookie
    );
    return selectedTenant;
  }

  isPageRequest(request: OpenSearchDashboardsRequest) {
    const path = request.url.pathname || '/';
    return path.startsWith('/app/') || path === '/' || path.startsWith('/goto/');
  }

  // abstract functions for concrete auth types to implement
  protected abstract requestIncludesAuthInfo(request: OpenSearchDashboardsRequest): boolean;
  protected abstract getAdditionalAuthHeader(request: OpenSearchDashboardsRequest): any;
  protected abstract getCookie(
    request: OpenSearchDashboardsRequest,
    authInfo: any
  ): SecuritySessionCookie;
  protected abstract async isValidCookie(cookie: SecuritySessionCookie): Promise<boolean>;
  protected abstract handleUnauthedRequest(
    request: OpenSearchDashboardsRequest,
    response: LifecycleResponseFactory,
    toolkit: AuthToolkit
  ): IOpenSearchDashboardsResponse | AuthResult;
  protected abstract buildAuthHeaderFromCookie(cookie: SecuritySessionCookie): any;
}
