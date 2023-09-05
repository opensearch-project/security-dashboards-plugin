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

import { SecurityPluginConfigType } from '../../../index';
import { SecuritySessionCookie } from '../../../session/security_cookie';
import { SecurityClient } from '../../../backend/opensearch_security_client';
import {
  SessionStorageFactory,
  IRouter,
} from '../../../../../../src/core/server';
import { CoreSetup } from '../../../../../../src/core/server';
import {
  KERBEROS_AUTH_LOGIN,
  KERBEROS_AUTH_LOGOUT,
} from '../../../../common';
import { validateNextUrl } from '../../../utils/next_url';


export class KerberosAuthRoutes {
  constructor(
    private readonly router: IRouter,
    // @ts-ignore: unused variable
    private readonly config: SecurityPluginConfigType,
    private readonly sessionStorageFactory: SessionStorageFactory<SecuritySessionCookie>,
    private readonly securityClient: SecurityClient,
    private readonly coreSetup: CoreSetup
  ) { }

  public setupRoutes() {
    this.router.get(
      {
        path: KERBEROS_AUTH_LOGIN,
        validate: {
          query: schema.object({
            nextUrl: schema.maybe(
              schema.string({
                validate: validateNextUrl,
              })
            ),
          }),
        },
        options: {
          // TODO: set to false?
          authRequired: 'optional',
        },
      },
      async (context, request, response) => {
        if (request.auth.isAuthenticated) {
          const nextUrl =
            request.query.nextUrl ||
            `${this.coreSetup.http.basePath.serverBasePath}/app/opensearch-dashboards`;
          response.redirected({
            headers: {
              location: nextUrl,
            },
          });
        }

        const loginEndpoint = this.config.kerberos.login_endpoint;
        if (loginEndpoint) {
          return response.redirected({
            headers: {
              location: loginEndpoint,
            },
          });
        } else {
          return response.badRequest();
        }
      }
    );

    this.router.post(
      {
        path: KERBEROS_AUTH_LOGOUT,
        validate: false,
      },
      async (context, request, response) => {
        this.sessionStorageFactory.asScoped(request).clear();
        return response.ok();
      }
    );
  }


}
