import { IClusterClient, KibanaRequest } from "../../../../src/core/server";
import { User} from "../auth/user";

export class SecurityClient {
  constructor(private readonly esClient: IClusterClient) {
  }

  public async authenticate(request: KibanaRequest, credentials: any): Promise<User> {
    const authHeader = Buffer.from(`${credentials.username}:${credentials.password}`).toString('base64');
    try {
      let esResponse = await this.esClient.asScoped(request).callAsCurrentUser('opendistro_security.authinfo', {
        headers: {
          authorization: `Basic ${authHeader}`,
        }
      });
      return new User(credentials.username, esResponse.roles, esResponse.backend_roles, esResponse.teanats, esResponse.user_requested_tenant, credentials, credentials);
    } catch (error) {
      throw new Error(error.message);
    }
  }

  public async authenticateWithHeader(request: KibanaRequest, headerName: string, headerValue: string, whitelistedHeadersAndValues: any, additionalAuthHeaders: any = {}): Promise<User> {
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
        headers: headers
      });
      return new User(esResponse.user_name, esResponse.roles, esResponse.backend_roles, esResponse.teanats, esResponse.user_requested_tenant, credentials, null);
    } catch (error) {
      throw new Error(error.message);
    }
  }

  public async authenticateWithHeaders(request: KibanaRequest, headerscredentials: any = {}, additionalAuthHeaders: any = {}) {
    try {
      const esResponse = await this.esClient.asScoped(request).callAsCurrentUser('opendistro_security.authinfo', {
        headers: additionalAuthHeaders,
      });
      return new User(esResponse.user_name, esResponse.roles, esResponse.backend_roles, esResponse.tenants, esResponse.user_requested_tenant);
    } catch (error) {
      throw new Error(error.message);
    }
  }

}
