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
import { KerberosAuthRoutes } from './routes';
import { AuthType, KERBEROS_AUTH_LOGIN } from '../../../../common';

export class KerberosAuthentication extends AuthenticationType {
  private authHeaderName: string;

  requestIncludesAuthInfo(request: OpenSearchDashboardsRequest): boolean {
    return request.headers.Authorization ? true : false;
  }
  public isValidCookie(
    cookie: SecuritySessionCookie,
    request: OpenSearchDashboardsRequest<unknown, unknown, unknown, any>
  ): Promise<boolean> {
    throw new Error('isValidCookie method not implemented');
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
  buildAuthHeaderFromCookie(
    cookie: SecuritySessionCookie,
    request: OpenSearchDashboardsRequest
  ): any {
    throw new Error('buildAuthHeaderFromCookie method not implemented.');
  }

  getAdditionalAuthHeader(request: OpenSearchDashboardsRequest): Promise<any> {
    throw new Error('getAdditionalAuthHeader method not implemented.');
  }

  getCookie(request: OpenSearchDashboardsRequest, authInfo: any): SecuritySessionCookie {
    const authorizationHeaderValue: string = request.headers[this.authHeaderName] as string;

    return {
      username: authInfo.user_name,
      credentials: {
        authHeaderValueExtra: true,
      },
      authType: AuthType.KERBEROS,
      expiryTime: Date.now() + this.config.session.ttl,
    };
  }

  handleUnauthedRequest(
    request: OpenSearchDashboardsRequest,
    response: LifecycleResponseFactory,
    toolkit: AuthToolkit
  ): IOpenSearchDashboardsResponse | AuthResult {
    const serverBasePath = this.coreSetup.http.basePath.serverBasePath;

    const loginEndpoint = this.config.kerberos.login_endpoint;
    if (loginEndpoint) {
      console.log('redriecting to login endpoint in unauthedrequest');
      return toolkit.redirected({
        location: `${serverBasePath}` + KERBEROS_AUTH_LOGIN,
      });
    } else {
      console.log('ERROROR');
      return toolkit.notHandled(); // TODO: redirect to error page?
    }
  }
}
