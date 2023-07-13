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

import { AuthenticationType } from '../authentication_type';
import { SecurityPluginConfigType } from '../../../index';
import { SecuritySessionCookie } from '../../../session/security_cookie';
import { CoreSetup } from 'opensearch-dashboards/server';
import {
  SessionStorageFactory,
  IRouter,
  ILegacyClusterClient,
  OpenSearchDashboardsRequest,
  Logger,

} from '../../../../../../src/core/server';

export class Kerberos extends  AuthenticationType{
  public requestIncludesAuthInfo(request: OpenSearchDashboardsRequest<unknown, unknown, unknown, any>): boolean {
      throw new Error('Method not implemented.');
  }
  public isValidCookie(cookie: SecuritySessionCookie, request: OpenSearchDashboardsRequest<unknown, unknown, unknown, any>): Promise<boolean> {
      throw new Error('Method not implemented.');
  }
  public init(): Promise<void> {
      throw new Error('Method not implemented.');
  }
  public readonly type: string = 'proxy';


  constructor(
    config: SecurityPluginConfigType,
    sessionStorageFactory: SessionStorageFactory<SecuritySessionCookie>,
    router: IRouter,
    esClient: ILegacyClusterClient,
    coreSetup: CoreSetup,
    logger: Logger
  ) {
    super(config, sessionStorageFactory, router, esClient, coreSetup, logger);
  }
  getAuthHeader(session) {
    if (session.credentials && session.credentials.authHeaderValue) {
      return {
        authorization: session.credentials.authHeaderValue,
      };
    }

    return false;
  }

  buildAuthHeaderFromCookie(cookie: SecuritySessionCookie, request): any {
    throw new Error('Method not implemented.');

  }

  getAdditionalAuthHeader(request): Promise<any> {
    throw new Error('Method not implemented.');
  }

  getCookie(request, authInfo: any): SecuritySessionCookie {
    throw new Error('Method not implemented.');
  }

  protected handleUnauthedRequest(request, response, toolkit) {
    throw new Error('Method not implemented.');
  }

}
