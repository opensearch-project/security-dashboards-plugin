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
import { resolveTenant, isValidTenant } from '../../multitenancy/tenant_resolver';
import { UnauthenticatedError } from '../../errors';
import { GLOBAL_TENANT_SYMBOL } from '../../../common';

export interface IAuthenticationType {
  type: string;
  authHandler: AuthenticationHandler;
  init: () => Promise<void>;
  requestIncludesAuthInfo(request: OpenSearchDashboardsRequest): boolean;
  buildAuthHeaderFromCookie(
    cookie: SecuritySessionCookie,
    request: OpenSearchDashboardsRequest
  ): any;
}

export type IAuthHandlerConstructor = new (
  config: SecurityPluginConfigType,
  sessionStorageFactory: SessionStorageFactory<SecuritySessionCookie>,
  router: IRouter,
  esClient: ILegacyClusterClient,
  coreSetup: CoreSetup,
  logger: Logger
) => IAuthenticationType;

export interface OpenSearchAuthInfo {
  user: string;
  user_name: string;
  user_requested_tenant: string;
  remote_address: string;
  backend_roles: string[];
  custom_attribute_names: string[];
  roles: string[];
  tenants: Record<string, boolean>;
  principal: string | null;
  peer_certificates: string | null;
  sso_logout_url: string | null;
}

export interface OpenSearchDashboardsAuthState {
  authInfo?: OpenSearchAuthInfo;
  selectedTenant?: string;
}

export abstract class AuthenticationType implements IAuthenticationType {
  protected static readonly ROUTES_TO_IGNORE: string[] = ['/app/login'];
  protected static readonly ROUTES_AUTH_OPTIONAL: string[] = ['/api/core/capabilities'];

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
    this.config = config;
  }

  public authHandler: AuthenticationHandler = async (request, response, toolkit) => {
    // Skip authentication for APIs that do not require it
    if (this.authNotRequired(request)) {
      return toolkit.authenticated();
    }

    const authState: OpenSearchDashboardsAuthState = {};
    const authHeaders = {};
    let cookie: SecuritySessionCookie | null | undefined;
    let authInfo: any | undefined;

    // If the request contains authentication data (e.g. Authorization header or JWT in url parameters), use that to authenticate the request.
    if (this.requestIncludesAuthInfo(request)) {
      try {
        // Build the auth headers from the request
        const additionalAuthHeader = await this.getAdditionalAuthHeader(request);
        Object.assign(authHeaders, additionalAuthHeader);
        authInfo = await this.securityClient.authinfo(request, additionalAuthHeader);
        cookie = this.getCookie(request, authInfo);

        // Set the tenant from the cookie
        const browserCookie = await this.sessionStorageFactory.asScoped(request).get();
        if (browserCookie && isValidTenant(browserCookie.tenant)) {
          cookie.tenant = browserCookie.tenant;
        }

        // Save the cookie
        this.sessionStorageFactory.asScoped(request).set(cookie);
      } catch (error: any) {
        return response.unauthorized({
          body: error.message,
        });
      }
    } else {
      // If the request does not contain authentication data, check for a stored cookie.
      try {
        cookie = await this.sessionStorageFactory.asScoped(request).get();
      } catch (error: any) {
        this.logger.error(`Error parsing cookie: ${error.message}`);
        cookie = undefined;
      }

      // If the cookie is not valid, clear the cookie and send the request to the authentication workflow
      if (!cookie || !(await this.isValidCookie(cookie, request))) {
        // Clear the cookie
        this.sessionStorageFactory.asScoped(request).clear();

        // For assets, we can still pass it to resource handler as notHandled.
        // Marking it as authenticated may result in login pop up when auth challenge
        // is enabled.
        if (request.url.pathname && request.url.pathname.startsWith('/bundles/')) {
          return toolkit.notHandled();
        }

        // Allow optional authentication
        if (this.authOptional(request)) {
          return toolkit.authenticated();
        }

        // Send the request to the authentication workflow
        return this.handleUnauthedRequest(request, response, toolkit);
      }

      // If the cookie is still valid, update the cookie with a new expiry time.
      if (this.config.session.keepalive) {
        cookie!.expiryTime = this.getKeepAliveExpiry(cookie!, request);
        this.sessionStorageFactory.asScoped(request).set(cookie!);
      }
      // At this point we have a valid cookie.

      // Build the auth headers from the cookie.
      const authHeadersFromCookie = this.buildAuthHeaderFromCookie(cookie!, request);
      Object.assign(authHeaders, authHeadersFromCookie);
      const additionalAuthHeader = await this.getAdditionalAuthHeader(request);
      Object.assign(authHeaders, additionalAuthHeader);
    }

    // resolve tenant if necessary
    if (this.config.multitenancy?.enabled) {
      try {
        const tenant = await this.resolveTenant(request, cookie!, authHeaders, authInfo);
        // return 401 if no tenant available
        if (!isValidTenant(tenant)) {
          return response.badRequest({
            body:
              'No available tenant for current user, please reach out to your system administrator',
          });
        }
        authState.selectedTenant = tenant;

        // set tenant in header
        if (this.config.multitenancy.enabled && this.config.multitenancy.enable_aggregation_view) {
          // Store all saved objects in a single kibana index.
          Object.assign(authHeaders, { securitytenant: GLOBAL_TENANT_SYMBOL });
        } else {
          Object.assign(authHeaders, { securitytenant: tenant });
        }

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
    if (!authInfo) {
      authInfo = await this.securityClient.authinfo(request, authHeaders);
    }
    authState.authInfo = authInfo;

    return toolkit.authenticated({
      requestHeaders: authHeaders,
      state: authState,
    });
  };

  authNotRequired(request: OpenSearchDashboardsRequest): boolean {
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
      // TODO: use opensearch-dashboards server user
      return true;
    }
    return false;
  }

  authOptional(request: OpenSearchDashboardsRequest): boolean {
    const pathname = request.url.pathname;
    if (!pathname) {
      return false;
    }
    return AuthenticationType.ROUTES_AUTH_OPTIONAL.includes(pathname!);
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
      } catch (error: any) {
        throw new UnauthenticatedError(error);
      }
    }

    const dashboardsInfo = await this.securityClient.dashboardsinfo(request, authHeader);

    return resolveTenant({
      request,
      username: authInfo.user_name,
      roles: authInfo.roles,
      availableTenants: authInfo.tenants,
      config: this.config,
      cookie,
      multitenancyEnabled: dashboardsInfo.multitenancy_enabled,
      privateTenantEnabled: dashboardsInfo.private_tenant_enabled,
      defaultTenant: dashboardsInfo.default_tenant,
    });
  }

  public getKeepAliveExpiry(
    cookie: SecuritySessionCookie,
    request: OpenSearchDashboardsRequest
  ): number {
    return Date.now() + this.config.session.ttl;
  }

  isPageRequest(request: OpenSearchDashboardsRequest) {
    const path = request.url.pathname || '/';
    return path.startsWith('/app/') || path === '/' || path.startsWith('/goto/');
  }

  // abstract functions for concrete auth types to implement
  public abstract getAdditionalAuthHeader(request: OpenSearchDashboardsRequest): Promise<any>;
  public abstract getCookie(
    request: OpenSearchDashboardsRequest,
    authInfo: any
  ): SecuritySessionCookie;
  public abstract isValidCookie(
    cookie: SecuritySessionCookie,
    request: OpenSearchDashboardsRequest
  ): Promise<boolean>;
  protected abstract handleUnauthedRequest(
    request: OpenSearchDashboardsRequest,
    response: LifecycleResponseFactory,
    toolkit: AuthToolkit
  ): IOpenSearchDashboardsResponse | AuthResult;
  public abstract requestIncludesAuthInfo(request: OpenSearchDashboardsRequest): boolean;
  public abstract buildAuthHeaderFromCookie(
    cookie: SecuritySessionCookie,
    request: OpenSearchDashboardsRequest
  ): any;
  public abstract init(): Promise<void>;
}
