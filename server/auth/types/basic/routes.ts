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

import { IRouter, SessionStorageFactory, KibanaRequest } from '../../../../../../src/core/server';
import { SecuritySessionCookie } from '../../../session/security_cookie';
import { SecurityPluginConfigType } from '../../..';
import { AuthConfig } from './basic_auth';
import { filterAuthHeaders } from '../../../utils/filter_auth_headers';
import { User } from '../../user';
import { SecurityClient } from '../../../backend/opendistro_security_client';
import { schema } from '@kbn/config-schema';
import { CoreSetup } from '../../../../../../src/core/server';

export class BasicAuthRoutes {
  constructor(
    private readonly router: IRouter,
    private readonly config: SecurityPluginConfigType,
    private readonly sessionStorageFactory: SessionStorageFactory<SecuritySessionCookie>,
    private readonly securityClient: SecurityClient,
    private readonly authConfig: AuthConfig,
    private readonly coreSetup: CoreSetup
  ) {}

  public async setupRoutes() {
    const PREFIX = '';

    // login using username and password
    this.router.post(
      {
        path: `${PREFIX}/auth/login`,
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
        const forbidden_usernames = this.config.auth.forbidden_usernames;
        if (forbidden_usernames.indexOf(request.body.username) > -1) {
          throw new Error('Invalid username or password'); // Cannot login using forbidden user name.
        }

        // const authHeaderValue = Buffer.from(`${request.body.username}:${request.body.password}`).toString('base64');
        let user: User;
        try {
          user = await this.securityClient.authenticate(request, { username: request.body.username, password: request.body.password });
        } catch (error) {
          return response.unauthorized({
            headers: {
              'www-authenticate': error.message,
            },
          });
        }

        const encodedCredentials = Buffer.from(`${request.body.username}:${request.body.password}`).toString('base64');
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

        if (this.config.multitenancy?.enabled || false) {
          let globalTenantEnabled = this.config.multitenancy.tenants.enable_global;
          let privateTentantEnabled = this.config.multitenancy.tenants.enable_private;
          let preferredTenants = this.config.multitenancy.tenants.preferred;

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
        path: `${PREFIX}/auth/logout`,
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
        path: `${PREFIX}/auth/anonymous`,
        validate: false,
        options: {
          authRequired: false,
        },
      },
      async (context, request, response) => {
        if (this.config.auth.anonymous_auth_enabled) {
          // TODO: implement anonymous auth for basic authentication
        } else {
          return response.redirected({
            headers: {
              location: `${PREFIX}/login`,
            },
          });
        }
      }
    );

    // renders custom error page
    this.router.get(
      {
        path: `${PREFIX}/customerror`,
        validate: false,
        options: {
          authRequired: false,
        },
      },
      async (context, request, response) => {
        return response.ok({
          body: '',
        });
      }
    );
  }

  // session storage plugin's authenticateWithHeaders() function
  private async authenticateWithHeaders(request: KibanaRequest, credentials: any = {}, options: any = {}) {
    try {
      const additionalAuthHeaders = filterAuthHeaders(request.headers, this.authConfig.allowedAdditionalAuthHeaders);
      let user = await this.securityClient.authenticateWithHeaders(request, credentials, additionalAuthHeaders);

      let session: SecuritySessionCookie = {
        username: user.username,
        credentials: credentials,
        authType: this.authConfig.authType,
        assignAuthHeader: false,
      };
      let sessionTtl = this.config.session.ttl;
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

  private handleAuthResponse(request: KibanaRequest, authResponse: AuthResponse, additionalAuthHeaders: any = {}) {
    // Validate the user has at least one tenant
    if (this.authConfig.validateAvailableTenants && this.config.multitenancy.enabled && !this.config.multitenancy.tenants.enable_global) {
      let privateTentantEnabled = this.config.multitenancy.tenants.enable_private;
      let allTenants = authResponse.user.tenants;

      if (!this._hasAtLastOneTenant(authResponse.user, allTenants, privateTentantEnabled)) {
        throw new Error('No tenant available for this user, please contact your system administrator.');
      }
    }

    if (this.authConfig.validateAvailableRoles && (!authResponse.user.roles || authResponse.user.roles.length === 0)) {
      throw new Error('No roles available for this user, please contact your system administrator.');
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

class AuthResponse {
  session: SecuritySessionCookie;
  user: User;
}
