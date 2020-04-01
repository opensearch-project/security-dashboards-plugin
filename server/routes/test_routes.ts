import { IRouter, IClusterClient, SessionStorageFactory } from "../../../../src/core/server";
import { SecuritySessionCookie } from "../session/security_cookie";
import { schema } from '@kbn/config-schema';
import { User } from "../auth/user";
import { SecurityClient } from "../backend/opendistro_security_client";
import { CoreSetup } from "../../../../src/core/server";

export function defineTestRoutes(router: IRouter,
  securityConfigClient: IClusterClient,
  sessionStorageFactory: SessionStorageFactory<SecuritySessionCookie>,
  core: CoreSetup) {

  router.get({
    path: `/test/login`,
    validate: {
      query: schema.object({
        username: schema.string(),
        password: schema.string(),
      }),
    },
    options: {
      authRequired: false,
    }
  },
  async (context, request, response) => {
    sessionStorageFactory.asScoped(request).clear();
    const username = request.query.username;
    const password = request.query.password;
    let user: User;
    try {
      const securityClient = new SecurityClient(securityConfigClient);
      user = await securityClient.authenticate(request, { username, password});
      const encodedCredentials = Buffer.from(`${username}:${password}`).toString('base64');
      const sessionStorage: SecuritySessionCookie = {
        username: user.username,
        credentials: {
          authHeaderValue: `Basic ${encodedCredentials}`,
        },
        authType: 'basicauth',
        isAnonymousAuth: false,
        expiryTime: Date.now() + 3600000000,
      }
      sessionStorageFactory.asScoped(request).set(sessionStorage);
      return response.redirected({
        headers: {
          location: `${core.http.basePath.serverBasePath}/app/kibana`,
        }
      });
    } catch (error) {
      return response.unauthorized({
        body: `Failed to authenticate with username: '${username}' and password: '${password}'`,
      })
    }
  });
}