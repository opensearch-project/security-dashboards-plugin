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

import { IRouter, SessionStorageFactory, CoreSetup } from 'opensearch-dashboards/server';
import { sign } from 'jsonwebtoken';
import { SecuritySessionCookie } from '../../../session/security_cookie';
import { SecurityPluginConfigType } from '../../..';
import { User } from '../../user';
import { SecurityClient } from '../../../backend/opensearch_security_client';
import { KERBEROS_AUTH_LOGIN, API_AUTH_LOGOUT } from '../../../../common';
import { resolveTenant } from '../../../multitenancy/tenant_resolver';
import { AuthType } from '../../../../common';

export class KerberosAuthRoutes {
  constructor(
    private readonly router: IRouter,
    private readonly config: SecurityPluginConfigType,
    private readonly sessionStorageFactory: SessionStorageFactory<SecuritySessionCookie>,
    private readonly securityClient: SecurityClient,
    private readonly coreSetup: CoreSetup
  ) {}

  public setupRoutes() {
    // login
    this.router.get(
      {
        path: KERBEROS_AUTH_LOGIN,
        validate: false,
        options: {
          authRequired: false,
        },
      },
      async (context, request, response) => {
        let user: User;
        try {
          user = await this.securityClient.authinfo(request);
        } catch (error) {
          context.security_plugin.logger.error(`Failed authentication: ${error}`);
          return response.unauthorized({
            body: `Kerberos authentication failed`,
          });
        }

        // clear session
        this.sessionStorageFactory.asScoped(request).clear();
        user.default_tenant;
        const payload = {
          exp: Date.now() + this.config.session.ttl,
          user: user.user_name,
          roles: user.roles,
          default_tenant: user.default_tenant,
        };

        const encodedCredentials = sign(payload, this.config.kerberos.jwt_siging_key);

        const sessionStorage: SecuritySessionCookie = {
          username: user.user_name,
          credentials: {
            authHeaderValue: `Bearer ${encodedCredentials}`,
          },
          authType: AuthType.JWT,
          isAnonymousAuth: false,
          expiryTime: Date.now() + this.config.session.ttl,
          tenant: user.tenants,
        };

        if (user.multitenancy_enabled) {
          const selectTenant = resolveTenant({
            request,
            username: user.user_name,
            roles: user.roles,
            availableTenants: user.tenants,
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

        // return to root
        return response.redirected({
          headers: {
            location: '/',
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
  }
}
