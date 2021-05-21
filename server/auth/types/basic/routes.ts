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

import { schema } from '@osd/config-schema';
import { IRouter, SessionStorageFactory, CoreSetup } from 'opensearch-dashboards/server';
import {
  SecuritySessionCookie,
  clearOldVersionCookieValue,
} from '../../../session/security_cookie';
import { SecurityPluginConfigType } from '../../..';
import { User } from '../../user';
import { SecurityClient } from '../../../backend/opensearch_security_client';
import { API_AUTH_LOGIN, API_AUTH_LOGOUT, LOGIN_PAGE_URI } from '../../../../common';
import { resolveTenant } from '../../../multitenancy/tenant_resolver';

export class BasicAuthRoutes {
  constructor(
    private readonly router: IRouter,
    private readonly config: SecurityPluginConfigType,
    private readonly sessionStorageFactory: SessionStorageFactory<SecuritySessionCookie>,
    private readonly securityClient: SecurityClient,
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
        this.sessionStorageFactory.asScoped(request).clear();
        const clearOldVersionCookie = clearOldVersionCookieValue(this.config);
        return response.renderAnonymousCoreApp({
          headers: {
            'set-cookie': clearOldVersionCookie,
          },
        });
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
          expiryTime: Date.now() + this.config.session.ttl,
        };

        if (this.config.multitenancy?.enabled) {
          const selectTenant = resolveTenant(
            request,
            user.username,
            user.tenants,
            this.config,
            sessionStorage
          );
          sessionStorage.tenant = selectTenant;
        }
        this.sessionStorageFactory.asScoped(request).set(sessionStorage);

        return response.ok({
          body: {
            username: user.username,
            tenants: user.tenants,
            roles: user.roles,
            backendroles: user.backendRoles,
            selectedTenants: this.config.multitenancy?.enabled ? sessionStorage.tenant : undefined,
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
        return response.ok({
          body: {},
        });
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
          let user: User;
          try {
            user = await this.securityClient.authenticateWithHeaders(request, {});
          } catch (error) {
            context.security_plugin.logger.error(`Failed authentication: ${error}`);
            return response.unauthorized({
              headers: {
                'www-authenticate': error.message,
              },
            });
          }

          this.sessionStorageFactory.asScoped(request).clear();
          const sessionStorage: SecuritySessionCookie = {
            username: user.username,
            authType: 'basicauth',
            isAnonymousAuth: true,
            expiryTime: Date.now() + this.config.session.ttl,
          };

          if (this.config.multitenancy?.enabled) {
            const selectTenant = resolveTenant(
              request,
              user.username,
              user.tenants,
              this.config,
              sessionStorage
            );
            sessionStorage.tenant = selectTenant;
          }
          this.sessionStorageFactory.asScoped(request).set(sessionStorage);

          return response.ok({
            body: {
              username: user.username,
              tenants: user.tenants,
              roles: user.roles,
              backendroles: user.backendRoles,
              selectedTenants: this.config.multitenancy?.enabled
                ? sessionStorage.tenant
                : undefined,
            },
          });
        } else {
          return response.badRequest({
            body: 'Anonymous auth is disabled.',
          });
        }
      }
    );
  }
}
