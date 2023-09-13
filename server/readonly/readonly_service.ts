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

import {
  Logger,
  OpenSearchDashboardsRequest,
  SessionStorageFactory,
} from '../../../../src/core/server';
import { globalTenantName, isPrivateTenant } from '../../common';
import { SecurityClient } from '../backend/opensearch_security_client';
import { IAuthenticationType } from '../auth/types/authentication_type';
import { SecuritySessionCookie } from '../session/security_cookie';
import { SecurityPluginConfigType } from '../index';
import { ReadonlyService as BaseReadonlyService } from '../../../../src/core/server/security/readonly_service';

export class ReadonlyService extends BaseReadonlyService {
  private readonly logger: Logger;
  private readonly securityClient: SecurityClient;
  private readonly auth: IAuthenticationType;
  private readonly securitySessionStorageFactory: SessionStorageFactory<SecuritySessionCookie>;
  private readonly config: SecurityPluginConfigType;

  constructor(
    logger: Logger,
    securityClient: SecurityClient,
    auth: IAuthenticationType,
    securitySessionStorageFactory: SessionStorageFactory<SecuritySessionCookie>,
    config: SecurityPluginConfigType
  ) {
    super();
    this.logger = logger;
    this.securityClient = securityClient;
    this.auth = auth;
    this.securitySessionStorageFactory = securitySessionStorageFactory;
    this.config = config;
  }

  isAnonymousPage(request: OpenSearchDashboardsRequest) {
    if (!request.headers || !request.headers.referer) {
      return false;
    }

    try {
      const url = new URL(request.headers.referer as string);
      const pathsToIgnore = ['login', 'logout', 'customerror'];
      return pathsToIgnore.includes(url.pathname?.split('/').pop() || '');
    } catch (error: any) {
      this.logger.error(`Could not parse the referer for the capabilites: ${error.stack}`);
    }
  }

  isReadOnlyTenant(authInfo: any): boolean {
    const currentTenant = authInfo.user_requested_tenant || globalTenantName;

    // private tenant is not affected
    if (isPrivateTenant(currentTenant)) {
      return false;
    }

    return authInfo.tenants[currentTenant] !== true;
  }

  async isReadonly(request: OpenSearchDashboardsRequest): Promise<boolean> {
    // omit for anonymous pages to avoid authentication errors
    if (this.isAnonymousPage(request)) {
      return false;
    }

    if (!this.config.multitenancy.enabled) {
      return false;
    }

    try {
      const cookie = await this.securitySessionStorageFactory.asScoped(request).get();
      let headers = request.headers;

      if (!this.auth.requestIncludesAuthInfo(request) && cookie) {
        headers = this.auth.buildAuthHeaderFromCookie(cookie, request);
      }

      const authInfo = await this.securityClient.authinfo(request, headers);

      if (!authInfo.user_requested_tenant && cookie) {
        authInfo.user_requested_tenant = cookie.tenant;
      }

      return authInfo && this.isReadOnlyTenant(authInfo);
    } catch (error: any) {
      return false;
    }
  }
}
