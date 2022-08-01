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
import { randomString } from '@hapi/cryptiles';
import { stringify } from 'querystring';
import wreck from '@hapi/wreck';
import {
  IRouter,
  SessionStorageFactory,
  CoreSetup,
  OpenSearchDashboardsResponseFactory,
  OpenSearchDashboardsRequest,
} from '../../../../../../src/core/server';
import { clearOldVersionCookieValue, SecuritySessionCookie } from '../../../session/security_cookie';
import { SecurityPluginConfigType } from '../../..';
import { OpenIdAuthConfig } from '../openid/openid_auth';
import { SecurityClient } from '../../../backend/opensearch_security_client';
import { getBaseRedirectUrl, callTokenEndpoint, composeLogoutUrl } from '../openid/helper';
import { validateNextUrl } from '../../../utils/next_url';
import { API_AUTH_LOGIN, API_AUTH_LOGOUT, AuthType, LOGIN_PAGE_URI } from '../../../../common';
import { User } from '../../user';
import { encodeUriQuery } from '../../../../../../src/plugins/opensearch_dashboards_utils/common/url/encode_uri_query';
import { OpenIdAuthRoutes} from '../openid/routes';
import { BasicAuthRoutes} from '../basic/routes';
import { resolveTenant } from '../../../multitenancy/tenant_resolver';
import { Client } from '@opensearch-project/opensearch';

export class MultiAuthRoutes {
  private static readonly NONCE_LENGTH: number = 22;

  constructor(
    private readonly router: IRouter,
    private readonly config: SecurityPluginConfigType,
    private readonly sessionStorageFactory: SessionStorageFactory<SecuritySessionCookie>,
    private readonly openIdAuthConfig: OpenIdAuthConfig,
    private readonly securityClient: SecurityClient,
    private readonly coreSetup: CoreSetup,
    private readonly wreckClient: typeof wreck, 
    private readonly authTypes: string
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
}
