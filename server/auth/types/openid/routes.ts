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
import { schema } from '@osd/config-schema';
import { randomString } from '@hapi/cryptiles';
import { stringify } from 'querystring';
import wreck from '@hapi/wreck';
import {
  IRouter,
  SessionStorageFactory,
  CoreSetup,
  OpenSearchDashboardsResponseFactory,
  OpenSearchDashboardsRequest,
} from '../../../../../../src/core/server';
import { SecuritySessionCookie } from '../../../session/security_cookie';
import { SecurityPluginConfigType } from '../../..';
import { OpenIdAuthConfig } from './openid_auth';
import { SecurityClient } from '../../../backend/opensearch_security_client';
import { getBaseRedirectUrl, callTokenEndpoint, composeLogoutUrl } from './helper';
import { validateNextUrl } from '../../../utils/next_url';

export class OpenIdAuthRoutes {
  private static readonly NONCE_LENGTH: number = 22;

  constructor(
    private readonly router: IRouter,
    private readonly config: SecurityPluginConfigType,
    private readonly sessionStorageFactory: SessionStorageFactory<SecuritySessionCookie>,
    private readonly openIdAuthConfig: OpenIdAuthConfig,
    private readonly securityClient: SecurityClient,
    private readonly core: CoreSetup,
    private readonly wreckClient: typeof wreck
  ) {}

  private redirectToLogin(
    request: OpenSearchDashboardsRequest,
    response: OpenSearchDashboardsResponseFactory
  ) {
    this.sessionStorageFactory.asScoped(request).clear();
    return response.redirected({
      headers: {
        location: `${this.core.http.basePath.serverBasePath}/auth/openid/login`,
      },
    });
  }

  public setupRoutes() {
    this.router.get(
      {
        path: `/auth/openid/login`,
        validate: {
          query: schema.object(
            {
              code: schema.maybe(schema.string()),
              nextUrl: schema.maybe(
                schema.string({
                  validate: validateNextUrl,
                })
              ),
              state: schema.maybe(schema.string()),
              refresh: schema.maybe(schema.string()),
            },
            {
              unknowns: 'allow',
            }
          ),
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
            redirect_uri: `${getBaseRedirectUrl(this.config, this.core)}/auth/openid/login`,
            state: nonce,
            scope: this.openIdAuthConfig.scope,
          };

          const queryString = stringify(query);
          const location = `${this.openIdAuthConfig.authorizationEndpoint}?${queryString}`;
          const cookie: SecuritySessionCookie = {
            oidc: {
              state: nonce,
              nextUrl: request.query.nextUrl || '/',
            },
          };
          this.sessionStorageFactory.asScoped(request).set(cookie);
          return response.redirected({
            headers: {
              location,
            },
          });
        }

        // Authentication callback

        // validate state first
        let cookie;
        try {
          cookie = await this.sessionStorageFactory.asScoped(request).get();
          if (
            !cookie ||
            !cookie.oidc?.state ||
            cookie.oidc.state !== (request.query as any).state
          ) {
            return this.redirectToLogin(request, response);
          }
        } catch (error) {
          return this.redirectToLogin(request, response);
        }
        const nextUrl: string = cookie.oidc.nextUrl;

        const clientId = this.config.openid?.client_id;
        const clientSecret = this.config.openid?.client_secret;
        const query: any = {
          grant_type: 'authorization_code',
          code: request.query.code,
          redirect_uri: `${getBaseRedirectUrl(this.config, this.core)}/auth/openid/login`,
          client_id: clientId,
          client_secret: clientSecret,
        };

        try {
          const tokenResponse = await callTokenEndpoint(
            this.openIdAuthConfig.tokenEndpoint!,
            query,
            this.wreckClient
          );

          const user = await this.securityClient.authenticateWithHeader(
            request,
            this.openIdAuthConfig.authHeaderName as string,
            `Bearer ${tokenResponse.idToken}`
          );

          // set to cookie
          const sessionStorage: SecuritySessionCookie = {
            username: user.username,
            credentials: {
              authHeaderValue: `Bearer ${tokenResponse.idToken}`,
              expires_at: Date.now() + tokenResponse.expiresIn! * 1000, // expiresIn is in second
            },
            authType: 'openid',
            expiryTime: Date.now() + this.config.session.ttl,
          };
          if (this.config.openid?.refresh_tokens && tokenResponse.refreshToken) {
            Object.assign(sessionStorage.credentials, {
              refresh_token: tokenResponse.refreshToken,
            });
          }
          this.sessionStorageFactory.asScoped(request).set(sessionStorage);
          return response.redirected({
            headers: {
              location: nextUrl,
            },
          });
        } catch (error) {
          context.security_plugin.logger.error(`OpenId authentication failed: ${error}`);
          // redirect to login
          return this.redirectToLogin(request, response);
        }
      }
    );

    this.router.get(
      {
        path: `/auth/logout`,
        validate: false,
      },
      async (context, request, response) => {
        const cookie = await this.sessionStorageFactory.asScoped(request).get();
        this.sessionStorageFactory.asScoped(request).clear();

        // authHeaderValue is the bearer header, e.g. "Bearer <auth_token>"
        const token = cookie?.credentials.authHeaderValue.split(' ')[1]; // get auth token
        const logoutQueryParams = {
          post_logout_redirect_uri: getBaseRedirectUrl(this.config, this.core),
          id_token_hint: token,
        };

        const endSessionUrl = composeLogoutUrl(
          this.config.openid?.logout_url,
          this.openIdAuthConfig.endSessionEndpoint,
          logoutQueryParams
        );

        return response.redirected({
          headers: {
            location: endSessionUrl,
          },
        });
      }
    );
  }
}
