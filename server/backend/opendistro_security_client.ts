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

import { IClusterClient, KibanaRequest } from '../../../../src/core/server';
import { User } from '../auth/user';

export class SecurityClient {
  constructor(private readonly esClient: IClusterClient) {}

  public async authenticate(request: KibanaRequest, credentials: any): Promise<User> {
    const authHeader = Buffer.from(`${credentials.username}:${credentials.password}`).toString('base64');
    try {
      let esResponse = await this.esClient.asScoped(request).callAsCurrentUser('opendistro_security.authinfo', {
        headers: {
          authorization: `Basic ${authHeader}`,
        },
      });
      return {
        username: credentials.username,
        roles: esResponse.roles,
        backendRoles: esResponse.backend_roles,
        tenants: esResponse.teanats,
        selectedTenant: esResponse.user_requested_tenant,
        credentials: credentials,
        proxyCredentials: credentials,
      };
    } catch (error) {
      throw new Error(error.message);
    }
  }

  public async authenticateWithHeader(
    request: KibanaRequest,
    headerName: string,
    headerValue: string,
    whitelistedHeadersAndValues: any,
    additionalAuthHeaders: any = {}
  ): Promise<User> {
    try {
      const credentials: any = {
        headerName,
        headerValue,
      };
      let headers = {};
      if (headerValue) {
        headers[headerName] = headerValue;
      }

      // cannot get config elasticsearch.requestHeadersWhitelist from kibana.yml file in new platfrom
      // meanwhile, do we really need to save all headers in cookie?
      const esResponse = await this.esClient.asScoped(request).callAsCurrentUser('opendistro_security.authinfo', {
        headers: headers,
      });
      return {
        username: esResponse.user_name,
        roles: esResponse.roles,
        backendRoles: esResponse.backend_roles,
        tenants: esResponse.teanats,
        selectedTenant: esResponse.user_requested_tenant,
        credentials: credentials,
      };
    } catch (error) {
      throw new Error(error.message);
    }
  }

  public async authenticateWithHeaders(
    request: KibanaRequest,
    headerscredentials: any = {}, // TODO: not used, remove it
    additionalAuthHeaders: any = {}
  ): Promise<User> {
    try {
      const esResponse = await this.esClient.asScoped(request).callAsCurrentUser('opendistro_security.authinfo', {
        headers: additionalAuthHeaders,
      });
      return {
        username: esResponse.user_name,
        roles: esResponse.roles,
        backendRoles: esResponse.backend_roles,
        tenants: esResponse.tenants,
        selectedTenant: esResponse.user_requested_tenant,
      };
    } catch (error) {
      throw new Error(error.message);
    }
  }

  public async authinfo(request: KibanaRequest) {
    try {
      return await this.esClient.asScoped(request).callAsCurrentUser('opendistro_security.authinfo');
    } catch (error) {
      throw new Error(error.message);
    }
  }

  // Multi-tenancy APIs
  public async getMultitenancyInfo(request: KibanaRequest) {
    try {
      return await this.esClient.asScoped(request).callAsCurrentUser('opendistro_security.multitenancyinfo');
    } catch (error) {
      throw new Error(error.message);
    }
  }

  public async getTenantInfoWithInternalUser() {
    try {
      return this.esClient.callAsInternalUser('opendistro_security.tenantinfo');
    } catch (error) {
      throw new Error(error.message);
    }
  }

  public async getTenantInfo(request: KibanaRequest) {
    try {
      return this.esClient.asScoped(request).callAsCurrentUser('opendistro_security.tenantinfo');
    } catch (error) {
      throw new Error(error.message);
    }
  }
}
