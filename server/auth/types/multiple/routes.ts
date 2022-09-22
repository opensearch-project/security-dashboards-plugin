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
import wreck from '@hapi/wreck';
import { IRouter, SessionStorageFactory, CoreSetup } from '../../../../../../src/core/server';
import { SecuritySessionCookie } from '../../../session/security_cookie';
import { SecurityPluginConfigType } from '../../..';
import { OpenIdAuthConfig } from '../openid/openid_auth';
import { SecurityClient } from '../../../backend/opensearch_security_client';
import { OpenIdAuthRoutes } from '../openid/routes';
import { BasicAuthRoutes } from '../basic/routes';
import { SamlAuthRoutes } from '../saml/routes';

export class MultiAuthRoutes {
  private static readonly NONCE_LENGTH: number = 22;

  constructor(
    private readonly router: IRouter,
    private readonly config: SecurityPluginConfigType,
    private readonly sessionStorageFactory: SessionStorageFactory<SecuritySessionCookie>,
    private readonly securityClient: SecurityClient,
    private readonly coreSetup: CoreSetup
  ) {}

  public setupBasicRoutes() {
    const basicRoute = new BasicAuthRoutes(
      this.router,
      this.config,
      this.sessionStorageFactory,
      this.securityClient,
      this.coreSetup
    );
    basicRoute.setupRoutes();
  }

  public setupOidcRoutes(openIdAuthConfig: OpenIdAuthConfig, wreckClient: typeof wreck) {
    console.log('Multi Auth:: OIDC:: setupOidcRoutes::');
    const oidcRoute = new OpenIdAuthRoutes(
      this.router,
      this.config,
      this.sessionStorageFactory,
      openIdAuthConfig,
      this.securityClient,
      this.coreSetup,
      wreckClient
    );
    oidcRoute.setupRoutes();
  }

  public setupSamlRoutes() {
    console.log('Multi Auth:: SAML:: setupSamlRoutes::');
    const samlAuthRoutes = new SamlAuthRoutes(
      this.router,
      this.config,
      this.sessionStorageFactory,
      this.securityClient,
      this.coreSetup
    );
    samlAuthRoutes.setupRoutes();
  }
}
