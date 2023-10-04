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

import { get } from 'lodash';
import { SecurityPluginConfigType } from '../../../index';
import { SecuritySessionCookie } from '../../../session/security_cookie';
import { SecurityClient } from '../../../backend/opensearch_security_client';
import { SessionStorageFactory, IRouter } from '../../../../../../src/core/server';
import { CoreSetup } from '../../../../../../src/core/server';
import { KERBEROS_AUTH_LOGIN, KERBEROS_AUTH_LOGOUT } from '../../../../common';
import { validateNextUrl } from '../../../utils/next_url';
export const WWW_AUTHENTICATE_HEADER_NAME = 'WWW-Authenticate';

export class KerberosAuthRoutes {
  constructor(
    private readonly router: IRouter,
    // @ts-ignore: unused variable
    private readonly config: SecurityPluginConfigType,
    private readonly sessionStorageFactory: SessionStorageFactory<SecuritySessionCookie>,
    private readonly securityClient: SecurityClient,
    private readonly coreSetup: CoreSetup
  ) {}

  public setupRoutes() {
    this.router.get(
      {
        path: KERBEROS_AUTH_LOGIN,
        validate: {
          query: schema.object({
            nextUrl: schema.maybe(
              schema.string({
                validate: validateNextUrl,
              })
            ),
          }),
        },
        options: {
          // TODO: set to false?
          authRequired: 'optional',
        },
      },
      async (context, request, response) => {
        console.log('ASYNC HAHAHAH %J ', request.headers);
        if (request.auth.isAuthenticated) {
          console.log('IS AUTHEITCATEDDDDDD');
          const nextUrl =
            request.query.nextUrl ||
            `${this.coreSetup.http.basePath.serverBasePath}/app/opensearch-dashboards`;
          response.redirected({
            headers: {
              location: nextUrl,
            },
          });
        }

        return await this.authenticateWithSPNEGO(request, response, this.securityClient);

        //  const loginEndpoint = this.config.kerberos.login_endpoint;
        //  const serverBasePath = this.coreSetup.http.basePath.serverBasePath;
        //
        // if (loginEndpoint) {
        //    console.log("redirecting to loginendpoint")
        //    return response.redirected({
        //      headers: {
        //        location: `${serverBasePath}` + KERBEROS_AUTH_LOGIN,
        //      },
        //    });
        //  } else {
        //    console.log("bad Request")
        //    return response.badRequest();
        //  }
      }
    );

    this.router.post(
      {
        path: KERBEROS_AUTH_LOGOUT,
        validate: false,
      },
      async (context, request, response) => {
        this.sessionStorageFactory.asScoped(request).clear();
        return response.ok();
      }
    );
  }
  async authenticateWithSPNEGO(request, response, securityClient) {
    let backendError;
    console.log('SP NEGO START');
    try {
      // const whitelistRoutes = this.config.get('searchguard.auth.unauthenticated_routes');
      // if (whitelistRoutes.includes(request.route.path)) {
      //   return this.securityClient.authenticated();
      // }

      let headers;
      if (request.headers.authorization) {
        console.log('HHHHHHHHH');
        headers = request.headers;
      }

      console.log(
        'handle Unahuthed Request, this is the request: headers  INSIDE',
        '%j',
        request.headers
      );

      const authInfo = await this.securityClient.authenticateWithHeaders(request, headers);

      console.log(`Authenticated: ${JSON.stringify(authInfo, null, 2)}.`);

      return securityClient.authenticated();
    } catch (error) {
      console.log(
        'CATCH Error wwwAuthenticateDirective2',
        get(error, `output.headers.${WWW_AUTHENTICATE_HEADER_NAME}`)
      );
      backendError = error.inner || error;
    }
    console.log('Backedn Error: ', backendError.toString());

    const negotiationProposal =
      get(backendError, `output.headers[${WWW_AUTHENTICATE_HEADER_NAME}]`, '') ||
      get(backendError, `meta.headers[${WWW_AUTHENTICATE_HEADER_NAME.toLowerCase()}]`, '');
    console.log(`Negotiating: ${negotiationProposal}`);

    const isNegotiating: boolean =
      negotiationProposal.startsWith('Negotiate') || // Kerberos negotiation  //TODO
      negotiationProposal === 'Basic realm="Authorization Required"'; // Basic auth negotiation

    // Browser should populate the header and repeat the request after the header is added...
    if (isNegotiating) {
      return response.unauthorized({
        headers: {
          [WWW_AUTHENTICATE_HEADER_NAME]: 'Negotiate', // TODO
        },
      });
    }

    return response.unauthorized({ body: backendError });
  }
}
