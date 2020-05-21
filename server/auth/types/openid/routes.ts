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
import {
  IRouter,
  SessionStorageFactory,
  CoreSetup,
} from '../../../../../../src/core/server';
import { SecuritySessionCookie } from '../../../session/security_cookie';
import { SecurityPluginConfigType } from '../../..';
import { schema } from '@kbn/config-schema';
import { randomString } from '@hapi/cryptiles';
import { parse, stringify } from 'querystring';
import { OpenIdAuthConfig } from './openid_auth';
import wreck from '@hapi/wreck';
import { SecurityClient } from '../../../backend/opendistro_security_client';

export class OpenIdAuthRoutes {
  private static readonly NONCE_LENGTH: number = 22;

  constructor(
    private readonly router: IRouter,
    private readonly config: SecurityPluginConfigType,
    private readonly sessionStorageFactory: SessionStorageFactory<SecuritySessionCookie>,
    private readonly openIdAuthConfig: OpenIdAuthConfig,
    private readonly securityClient: SecurityClient,
    private readonly core: CoreSetup
  ) {}

  public setupRoutes() {
    this.router.get(
      {
        path: `/auth/openid/login`,
        validate: {
          query: schema.object({
            code: schema.maybe(schema.string()),
            nextUrl: schema.maybe(schema.string()),
            state: schema.maybe(schema.string()),
            refresh: schema.maybe(schema.string()),
          }),
        },
        options: {
          authRequired: false,
        },
      },
      async (context, request, response) => {
        // implementation refers to https://github.com/hapijs/bell/blob/master/lib/oauth.js

        // Sign-in initialization
        if (!request.query.code) {
          const nonce = randomString(OpenIdAuthRoutes.NONCE_LENGTH);
          const query: any = {
            client_id: this.config.openid?.client_id,
            response_type: 'code',
            redirect_uri: `${this.getBaseRedirectUrl()}`,
            state: nonce,
          };

          const scope = this.config.openid?.scope || '';
          if (scope) {
            query.scope = scope;
          }

          const queryString = stringify(query);
          const location = `${this.openIdAuthConfig.authorizationEndpoint}?${queryString}`;
          const cookie: SecuritySessionCookie = {
            oidcState: nonce,
          };
          this.sessionStorageFactory.asScoped(request).set(cookie);
          return response.redirected({
            headers: {
              location: location,
            },
          });
        }

        // Authentication callback
        // TODO: figure out a decent way to validate the state from cookie
        const clientId = this.config.openid?.client_id;
        const clientSecret = this.config.openid?.client_secret;
        const query: any = {
          grant_type: 'authorization_code',
          code: request.query.code,
          redirect_uri: `${this.getBaseRedirectUrl()}`,
          client_id: clientId,
          client_secret: clientSecret,
        };

        const requestOptions: any = {
          payload: stringify(query),
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        };

        try {
          const tokenResponse = await wreck.post(
            this.openIdAuthConfig.tokenEndpoint as string,
            requestOptions
          );
          if (
            !tokenResponse.res.statusCode ||
            tokenResponse.res.statusCode < 200 ||
            tokenResponse.res.statusCode > 299
          ) {
            return response.unauthorized();
          }

          const tokenPayload: any = this.parseTokenResponse(tokenResponse.payload as Buffer);
          const idToken: string = tokenPayload.id_token;
          const accessToken: string = tokenPayload.access_token;
          const refreshToken: string = tokenPayload.refresh_token;
          const expiresIn: number = tokenPayload.expires_in;

          const user = await this.securityClient.authenticateWithHeader(
            request,
            this.openIdAuthConfig.authHeaderName as string,
            `Bearer ${idToken}`
          );

          // set to cookie
          const sessionStorage: SecuritySessionCookie = {
            username: user.username,
            credentials: {
              authHeaderValue: `Bearer ${idToken}`,
              refresh_token: refreshToken,
              expires_at: Date.now() + expiresIn * 1000, // expiresIn is in second
            },
            authType: 'openid',
            expiryTime: Date.now() + this.config.cookie.ttl,
          };
          this.sessionStorageFactory.asScoped(request).set(sessionStorage);
          return response.redirected({
            headers: {
              location: `${this.core.http.basePath.serverBasePath}/app/kibana`,
            },
          });
        } catch (error) {
          console.log(error); // TODO: change to logger
          return response.unauthorized();
        }
      }
    );

    this.router.post(
      {
        path: `/auth/logout`,
        validate: false,
      },
      async (context, request, response) => {
        const cookie = await this.sessionStorageFactory.asScoped(request).get();
        this.sessionStorageFactory.asScoped(request).clear();

        // authHeaderValue is the bearer header, e.g. "Bearer <auth_token>"
        const token = cookie?.credentials.authHeaderValue.split(' ')[1]; // get auth token
        let requestQueryParameters = `?post_logout_redirect_uri=${this.getBaseRedirectUrl()}/app/kibana`;

        let endSessionUrl = '/';
        const customLogoutUrl = this.config.openid?.logout_url;
        if (customLogoutUrl) {
          endSessionUrl = customLogoutUrl + requestQueryParameters;
        } else if (this.openIdAuthConfig.endSessionEndpoint) {
          endSessionUrl =
            this.openIdAuthConfig.endSessionEndpoint +
            requestQueryParameters +
            '&id_token_hint=' +
            token;
        }
        return response.redirected({
          headers: {
            location: endSessionUrl,
          }
        });
      }
    );
  }

  private parseTokenResponse(payload: Buffer) {
    const payloadString = payload.toString();
    if (payloadString.trim()[0] === '{') {
      try {
        return JSON.parse(payloadString);
      } catch (error) {
        throw Error(`Invalid JSON payload: ${error}`);
      }
    }
    return parse(payloadString);
  }

  private getBaseRedirectUrl(): string {
    if (this.config.openid?.base_redirect_url) {
      let baseRedirectUrl = this.config.openid.base_redirect_url;
      return baseRedirectUrl.endsWith('/') ? baseRedirectUrl.slice(0, -1) : baseRedirectUrl;
    }

    const host = this.core.http.getServerInfo().host;
    const port = this.core.http.getServerInfo().port;
    const protocol = this.core.http.getServerInfo().protocol;
    if (this.core.http.basePath.serverBasePath) {
      return `${protocol}://${host}:${port}${this.core.http.basePath.serverBasePath}`;
    }
    return `${protocol}://${host}:${port}`;
  }
}
