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

import { get } from 'lodash';
import { CoreSetup } from 'opensearch-dashboards/server';
import { AuthenticationType } from '../authentication_type';
import { SecurityPluginConfigType } from '../../../index';
import { SecuritySessionCookie } from '../../../session/security_cookie';
import {
  SessionStorageFactory,
  IRouter,
  ILegacyClusterClient,
  OpenSearchDashboardsRequest,
  Logger,
  IOpenSearchDashboardsResponse,
  AuthResult,
  LifecycleResponseFactory,
  AuthToolkit,
} from '../../../../../../src/core/server';
import { KerberosAuthRoutes, WWW_AUTHENTICATE_HEADER_NAME } from './routes';
import { KERBEROS_AUTH_LOGIN } from '../../../../common';

export class KerberosAuthentication extends AuthenticationType {
  private authHeaderName: string;

  requestIncludesAuthInfo(request: OpenSearchDashboardsRequest): boolean {
    console.debug(
      get(request.headers, 'authorization') &&
        get(request.headers, 'authorization').toString().startsWith('Negotiate')
    );
    if (
      get(request.headers, 'authorization') &&
      get(request.headers, 'authorization').toString().startsWith('Negotiate')
    ) {
      return true;
    }
    return false;
  }

  public async init() {
    const kerberosAuthRoutes = new KerberosAuthRoutes(
      this.router,
      this.config,
      this.sessionStorageFactory,
      this.securityClient,
      this.coreSetup
    );
    kerberosAuthRoutes.setupRoutes();
  }

  constructor(
    config: SecurityPluginConfigType,
    sessionStorageFactory: SessionStorageFactory<SecuritySessionCookie>,
    router: IRouter,
    esClient: ILegacyClusterClient,
    coreSetup: CoreSetup,
    logger: Logger
  ) {
    super(config, sessionStorageFactory, router, esClient, coreSetup, logger);

    this.authHeaderName = 'authorization';
  }

  async getAdditionalAuthHeader(
    request: OpenSearchDashboardsRequest<unknown, unknown, unknown, any>
  ): Promise<any> {
    const header: any = {};
    return header;
  }

  getCookie(request: OpenSearchDashboardsRequest, authInfo: any): SecuritySessionCookie {
    return {};
  }

  handleUnauthedRequest(
    request: OpenSearchDashboardsRequest,
    response: LifecycleResponseFactory,
    toolkit: AuthToolkit
  ): IOpenSearchDashboardsResponse | AuthResult {
    console.debug('Handling Unauthed Request');

    return response.unauthorized({
      headers: {
        [WWW_AUTHENTICATE_HEADER_NAME]: 'Negotiate',
      },
    });
  }
}
