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

import { schema } from '@osd/config-schema';
import { IRouter, SessionStorageFactory, CoreSetup } from 'opensearch-dashboards/server';
import {
  SecuritySessionCookie,
  clearOldVersionCookieValue,
} from '../../../session/security_cookie';
import { SecurityPluginConfigType } from '../../..';
import { User } from '../../user';
import { SecurityClient } from '../../../backend/opensearch_security_client';
import {
  ANONYMOUS_AUTH_LOGIN,
  API_AUTH_LOGIN,
  API_AUTH_LOGOUT,
  LOGIN_PAGE_URI,
} from '../../../../common';
import { resolveTenant } from '../../../multitenancy/tenant_resolver';
import { encodeUriQuery } from '../../../../../../src/plugins/opensearch_dashboards_utils/common/url/encode_uri_query';

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
        } catch (error: any) {
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

        if (user.multitenancy_enabled) {
          const selectTenant = resolveTenant({
            request,
            username: user.username,
            roles: user.roles,
            availabeTenants: user.tenants,
            config: this.config,
            cookie: sessionStorage,
            multitenancyEnabled: user.multitenancy_enabled,
            privateTenantEnabled: user.private_tenant_enabled,
            defaultTenant: user.default_tenant,
          });
          // const selectTenant = user.default_tenant;
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
        path: ANONYMOUS_AUTH_LOGIN,
        validate: false,
        options: {
          authRequired: false,
        },
      },
      async (context, request, response) => {
        if (this.config.auth.anonymous_auth_enabled) {
          let user: User;
          // If the request contains no redirect path, simply redirect to basepath.
          let redirectUrl: string = this.coreSetup.http.basePath.serverBasePath
            ? this.coreSetup.http.basePath.serverBasePath
            : '/';
          const requestQuery = request.url.searchParams;
          const nextUrl = requestQuery?.get('nextUrl');
          if (nextUrl) {
            redirectUrl = nextUrl;
          }
          context.security_plugin.logger.info('The Redirect Path is ' + redirectUrl);
          try {
            user = await this.securityClient.authenticateWithHeaders(request, {});
          } catch (error) {
            context.security_plugin.logger.error(
              `Failed authentication: ${error}. Redirecting to Login Page`
            );
            return response.redirected({
              headers: {
                location: `${this.coreSetup.http.basePath.serverBasePath}${LOGIN_PAGE_URI}${
                  nextUrl ? '?nextUrl=' + encodeUriQuery(redirectUrl) : ''
                }`,
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

          if (user.multitenancy_enabled) {
            const selectTenant = resolveTenant({
              request,
              username: user.username,
              roles: user.roles,
              availabeTenants: user.tenants,
              config: this.config,
              cookie: sessionStorage,
              multitenancyEnabled: user.multitenancy_enabled,
              privateTenantEnabled: user.private_tenant_enabled,
              defaultTenant: user.default_tenant,
            });
            sessionStorage.tenant = selectTenant;
          }
          this.sessionStorageFactory.asScoped(request).set(sessionStorage);

          return response.redirected({
            headers: {
              location: `${redirectUrl}`,
            },
          });
        } else {
          context.security_plugin.logger.error(
            'Anonymous auth is disabled. Redirecting to Login Page'
          );
          return response.redirected({
            headers: {
              location: `${this.coreSetup.http.basePath.serverBasePath}${LOGIN_PAGE_URI}`,
            },
          });
        }
      }
    );
  }
}
