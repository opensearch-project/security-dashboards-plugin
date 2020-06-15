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
import { User } from '../../user';
import { SecurityClient } from '../../../backend/opendistro_security_client';
import { CoreSetup } from '../../../../../../src/core/server';

export class ProxyAuthRoutes {
  constructor(
    private readonly router: IRouter,
    private readonly config: SecurityPluginConfigType,
    private readonly sessionStorageFactory: SessionStorageFactory<SecuritySessionCookie>,
    private readonly securityClient: SecurityClient,
    private readonly coreSetup: CoreSetup
  ) {}

  public setupRoutes() {
    this.router.get(
      {
        path: `/auth/proxy/login`,
        validate: {
          query: schema.object({
            nextUrl: schema.maybe(schema.string()),
          }),
        },
        options: {
          authRequired: 'optional',
        },
      },
      async (context, request, response) => {
        if (request.auth.isAuthenticated) {
          const nextUrl =
            request.query.nextUrl || `${this.coreSetup.http.basePath.serverBasePath}/app/kibana`;
          response.redirected({
            headers: {
              location: nextUrl,
            },
          });
        }

        const loginEndpoint = this.config.proxycache?.login_endpoint;
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
        path: `/auth/proxy/logout`,
        validate: false,
      },
      async (context, request, response) => {
        this.sessionStorageFactory.asScoped(request).clear();
        return response.ok();
      }
    );
  }
}
