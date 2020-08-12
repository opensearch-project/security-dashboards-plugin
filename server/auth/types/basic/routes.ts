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

import { schema } from '@kbn/config-schema';
import { IRouter, SessionStorageFactory, KibanaRequest } from '../../../../../../src/core/server';
import { SecuritySessionCookie } from '../../../session/security_cookie';
import { SecurityPluginConfigType } from '../../..';
import { AuthConfig } from './basic_auth';
import { filterAuthHeaders } from '../../../utils/filter_auth_headers';
import { User } from '../../user';
import { SecurityClient } from '../../../backend/opendistro_security_client';
import { CoreSetup } from '../../../../../../src/core/server';
import { API_AUTH_LOGIN, API_AUTH_LOGOUT, LOGIN_PAGE_URI } from '../../../../common';

export class BasicAuthRoutes {
  constructor(
    private readonly router: IRouter,
    private readonly config: SecurityPluginConfigType,
    private readonly sessionStorageFactory: SessionStorageFactory<SecuritySessionCookie>,
    private readonly securityClient: SecurityClient,
    private readonly authConfig: AuthConfig,

    // @ts-ignore unused variable
    private readonly coreSetup: CoreSetup
  ) {}

  public setupRoutes() {
    // bootstrap an empty page so that browser app can render the login page
    // using client side routing.
    this.coreSetup.http.resources.register(
      {
        path: LOGIN_PAGE_URI,
        validate: false,
        options: {
          authRequired: false,
        },
      },
      async (context, request, response) => {
        return response.renderAnonymousCoreApp();
      }
    );

    // login using username and password
    this.router.post(
      {
        path: API_AUTH_LOGIN,
        validate: {
          body: schema.object({
            username: schema.string(),
            password: schema.string(),
          }),
        },
        options: {
          authRequired: false,
        },
      },
      async (context, request, response) => {
        const forbiddenUsernames: string[] = this.config.auth.forbidden_usernames;
        if (forbiddenUsernames.indexOf(request.body.username) > -1) {
          context.security_plugin.logger.error(
            `Denied login for forbidden username ${request.body.username}`
          );
          return response.badRequest({
            // Cannot login using forbidden user name.
            body: 'Invalid username or password',
          });
        }

        let user: User;
        try {
          user = await this.securityClient.authenticate(request, {
            username: request.body.username,
            password: request.body.password,
          });
        } catch (error) {
          context.security_plugin.logger.error(`Failed authentication: ${error}`);
          return response.unauthorized({
            headers: {
              'www-authenticate': error.message,
            },
          });
        }

        this.sessionStorageFactory.asScoped(request).clear();
        const encodedCredentials = Buffer.from(
          `${request.body.username}:${request.body.password}`
        ).toString('base64');
        const sessionStorage: SecuritySessionCookie = {
          username: user.username,
          credentials: {
            authHeaderValue: `Basic ${encodedCredentials}`,
          },
          authType: 'basicauth',
          isAnonymousAuth: false,
          expiryTime: Date.now() + this.config.cookie.ttl,
        };
        this.sessionStorageFactory.asScoped(request).set(sessionStorage);

        if (this.config.multitenancy?.enabled) {
          // @ts-ignore
          const globalTenantEnabled = this.config.multitenancy?.tenants.enable_global || true;
          // @ts-ignore
          const privateTentantEnabled = this.config.multitenancy?.tenants.enable_private || true;
          // @ts-ignore
          const preferredTenants = this.config.multitenancy?.tenants.preferred;

          // TODO: figureout selected tenant here and set it in the cookie

          return response.ok({
            body: {
              username: user.username,
              tenants: user.tenants,
              roles: user.roles,
              backendroles: user.backendRoles,
              selectedTenants: '', // TODO: determine selected tenants
            },
          });
        }

        return response.ok({
          body: {
            username: user.username,
            tenants: user.tenants,
          },
        });
      }
    );

    // logout
    this.router.post(
      {
        path: API_AUTH_LOGOUT,
        validate: false,
        options: {
          authRequired: false,
        },
      },
      async (context, request, response) => {
        this.sessionStorageFactory.asScoped(request).clear();
        return response.ok(); // TODO: redirect to login?
      }
    );

    // anonymous auth
    this.router.get(
      {
        path: `/auth/anonymous`,
        validate: false,
        options: {
          authRequired: false,
        },
      },
      async (context, request, response) => {
        if (this.config.auth.anonymous_auth_enabled) {
          // TODO: implement anonymous auth for basic authentication
          return response.ok();
        } else {
          return response.redirected({
            headers: {
              location: `/login`,
            },
          });
        }
      }
    );
  }

  // session storage plugin's authenticateWithHeaders() function
  // @ts-ignore
  private async authenticateWithHeaders(
    request: KibanaRequest,
    credentials: any = {},
    options: any = {}
  ) {
    try {
      const additionalAuthHeaders = filterAuthHeaders(
        request.headers,
        this.authConfig.allowedAdditionalAuthHeaders
      );
      const user = await this.securityClient.authenticateWithHeaders(
        request,
        credentials,
        additionalAuthHeaders
      );

      const session: SecuritySessionCookie = {
        username: user.username,
        credentials,
        authType: this.authConfig.authType,
        assignAuthHeader: false,
      };
      const sessionTtl = this.config.session.ttl;
      if (sessionTtl) {
        session.expiryTime = Date.now() + sessionTtl;
      }
      const authResponse: AuthResponse = {
        session,
        user,
      };

      return this.handleAuthResponse(request, authResponse, additionalAuthHeaders);
    } catch (error) {
      this.sessionStorageFactory.asScoped(request).clear();
      throw error;
    }
  }

  private handleAuthResponse(
    request: KibanaRequest,
    authResponse: AuthResponse,
    additionalAuthHeaders: any = {}
  ) {
    // Validate the user has at least one tenant
    if (
      this.authConfig.validateAvailableTenants &&
      this.config.multitenancy?.enabled &&
      !this.config.multitenancy?.tenants.enable_global
    ) {
      const privateTentantEnabled = this.config.multitenancy?.tenants.enable_private;
      const allTenants = authResponse.user.tenants;

      if (!this._hasAtLastOneTenant(authResponse.user, allTenants, privateTentantEnabled)) {
        throw new Error(
          'No tenant available for this user, please contact your system administrator.'
        );
      }
    }

    if (
      this.authConfig.validateAvailableRoles &&
      (!authResponse.user.roles || authResponse.user.roles.length === 0)
    ) {
      throw new Error(
        'No roles available for this user, please contact your system administrator.'
      );
    }

    if (Object.keys(additionalAuthHeaders).length > 0) {
      authResponse.session.additionalAuthHeaders = additionalAuthHeaders;
    }

    this.sessionStorageFactory.asScoped(request).set(authResponse.session);

    return authResponse;
  }

  private _hasAtLastOneTenant(user: User, allTenant: any, privateTentantEnabled: boolean): boolean {
    if (privateTentantEnabled) {
      return true;
    }

    if (
      !allTenant ||
      Object.keys(allTenant).length === 0 ||
      (Object.keys(allTenant).length === 1 && Object.keys(allTenant)[0] === user.username)
    ) {
      return false;
    }
    return true;
  }
}

interface AuthResponse {
  session: SecuritySessionCookie;
  user: User;
}
