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

import { ILegacyClusterClient, OpenSearchDashboardsRequest } from '../../../../src/core/server';
import { User } from '../auth/user';

export class SecurityClient {
  constructor(private readonly esClient: ILegacyClusterClient) {}

  public async authenticate(request: OpenSearchDashboardsRequest, credentials: any): Promise<User> {
    const authHeader = Buffer.from(`${credentials.username}:${credentials.password}`).toString(
      'base64'
    );
    try {
      const esResponse = await this.esClient
        .asScoped(request)
        .callAsCurrentUser('opensearch_security.authinfo', {
          headers: {
            authorization: `Basic ${authHeader}`,
          },
        });
      return {
        username: credentials.username,
        roles: esResponse.roles,
        backendRoles: esResponse.backend_roles,
        tenants: esResponse.tenants,
        selectedTenant: esResponse.user_requested_tenant,
        credentials,
        proxyCredentials: credentials,
      };
    } catch (error) {
      throw new Error(error.message);
    }
  }

  public async authenticateWithHeader(
    request: OpenSearchDashboardsRequest,
    headerName: string,
    headerValue: string,
    whitelistedHeadersAndValues: any = {},
    additionalAuthHeaders: any = {}
  ): Promise<User> {
    try {
      const credentials: any = {
        headerName,
        headerValue,
      };
      const headers: any = {};
      if (headerValue) {
        headers[headerName] = headerValue;
      }

      // cannot get config elasticsearch.requestHeadersWhitelist from kibana.yml file in new platfrom
      // meanwhile, do we really need to save all headers in cookie?
      const esResponse = await this.esClient
        .asScoped(request)
        .callAsCurrentUser('opensearch_security.authinfo', {
          headers,
        });
      return {
        username: esResponse.user_name,
        roles: esResponse.roles,
        backendRoles: esResponse.backend_roles,
        tenants: esResponse.teanats,
        selectedTenant: esResponse.user_requested_tenant,
        credentials,
      };
    } catch (error) {
      throw new Error(error.message);
    }
  }

  public async authenticateWithHeaders(
    request: OpenSearchDashboardsRequest,
    additionalAuthHeaders: any = {}
  ): Promise<User> {
    try {
      const esResponse = await this.esClient
        .asScoped(request)
        .callAsCurrentUser('opensearch_security.authinfo', {
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

  public async authinfo(request: OpenSearchDashboardsRequest, headers: any = {}) {
    try {
      return await this.esClient
        .asScoped(request)
        .callAsCurrentUser('opensearch_security.authinfo', {
          headers,
        });
    } catch (error) {
      throw new Error(error.message);
    }
  }

  // Multi-tenancy APIs
  public async getMultitenancyInfo(request: OpenSearchDashboardsRequest) {
    try {
      return await this.esClient
        .asScoped(request)
        .callAsCurrentUser('opensearch_security.multitenancyinfo');
    } catch (error) {
      throw new Error(error.message);
    }
  }

  public async getTenantInfoWithInternalUser() {
    try {
      return this.esClient.callAsInternalUser('opensearch_security.tenantinfo');
    } catch (error) {
      throw new Error(error.message);
    }
  }

  public async getTenantInfo(request: OpenSearchDashboardsRequest) {
    try {
      return await this.esClient
        .asScoped(request)
        .callAsCurrentUser('opensearch_security.tenantinfo');
    } catch (error) {
      throw new Error(error.message);
    }
  }

  public async getSamlHeader(request: OpenSearchDashboardsRequest) {
    try {
      // response is expected to be an error
      await this.esClient.asScoped(request).callAsCurrentUser('opensearch_security.authinfo');
    } catch (error) {
      // the error looks like
      // wwwAuthenticateDirective:
      //   '
      //     X-Security-IdP realm="Open Distro Security"
      //     location="https://<your-auth-domain.com>/api/saml2/v1/sso?SAMLRequest=<some-encoded-string>"
      //     requestId="<request_id>"
      //   '
      if (!error.wwwAuthenticateDirective) {
        throw error;
      }

      try {
        const locationRegExp = /location="(.*?)"/;
        const requestIdRegExp = /requestId="(.*?)"/;

        const locationExecArray = locationRegExp.exec(error.wwwAuthenticateDirective);
        const requestExecArray = requestIdRegExp.exec(error.wwwAuthenticateDirective);
        if (locationExecArray && requestExecArray) {
          return {
            location: locationExecArray[1],
            requestId: requestExecArray[1],
          };
        }
        throw Error('failed parsing SAML config');
      } catch (parsingError) {
        console.log(parsingError);
        throw new Error(parsingError);
      }
    }
    throw new Error(`Invalid SAML configuration.`);
  }

  public async authToken(
    requestId: string | undefined,
    samlResponse: any,
    acsEndpoint: any | undefined = undefined
  ) {
    const body = {
      RequestId: requestId,
      SAMLResponse: samlResponse,
      acsEndpoint,
    };
    try {
      return await this.esClient.asScoped().callAsCurrentUser('opensearch_security.authtoken', {
        body,
      });
    } catch (error) {
      console.log(error);
      throw new Error('failed to get token');
    }
  }
}
