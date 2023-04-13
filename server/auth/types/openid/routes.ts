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
import { randomString } from '@hapi/cryptiles';
import { stringify } from 'querystring';
import wreck from '@hapi/wreck';
import {
  IRouter,
  SessionStorageFactory,
  CoreSetup,
  OpenSearchDashboardsResponseFactory,
  OpenSearchDashboardsRequest,
  Logger,
} from '../../../../../../src/core/server';
import { SecuritySessionCookie } from '../../../session/security_cookie';
import { SecurityPluginConfigType } from '../../..';
import { OpenIdAuthConfig } from './openid_auth';
import { SecurityClient } from '../../../backend/opensearch_security_client';
import {
  getBaseRedirectUrl,
  callTokenEndpoint,
  composeLogoutUrl,
  getNextUrl,
  getExpirationDate,
} from './helper';
import { validateNextUrl } from '../../../utils/next_url';
import {
  AuthType,
  OPENID_AUTH_LOGIN,
  AUTH_GRANT_TYPE,
  AUTH_RESPONSE_TYPE,
  OPENID_AUTH_LOGOUT,
  LOGIN_PAGE_URI,
} from '../../../../common';

import {
  clearSplitCookies,
  ExtraAuthStorageOptions,
  getExtraAuthStorageValue,
  setExtraAuthStorage,
} from '../../../session/cookie_splitter';

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
        location: `${this.core.http.basePath.serverBasePath}${OPENID_AUTH_LOGIN}`,
      },
    });
  }

  private getExtraAuthStorageOptions(logger?: Logger): ExtraAuthStorageOptions {
    // If we're here, we will always have the openid configuration
    return {
      cookiePrefix: this.config.openid!.extra_storage.cookie_prefix,
      additionalCookies: this.config.openid!.extra_storage.additional_cookies,
      logger,
    };
  }

  public setupRoutes() {
    this.router.get(
      {
        path: OPENID_AUTH_LOGIN,
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
            response_type: AUTH_RESPONSE_TYPE,
            redirect_uri: `${getBaseRedirectUrl(
              this.config,
              this.core,
              request
            )}${OPENID_AUTH_LOGIN}`,
            state: nonce,
            scope: this.openIdAuthConfig.scope,
          };
          const queryString = stringify(query);
          const location = `${this.openIdAuthConfig.authorizationEndpoint}?${queryString}`;
          const cookie: SecuritySessionCookie = {
            oidc: {
              state: nonce,
              nextUrl: getNextUrl(this.config, this.core, request),
            },
            authType: AuthType.OPEN_ID,
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
          grant_type: AUTH_GRANT_TYPE,
          code: request.query.code,
          redirect_uri: `${getBaseRedirectUrl(
            this.config,
            this.core,
            request
          )}${OPENID_AUTH_LOGIN}`,
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
              authHeaderValueExtra: true,
              expires_at: getExpirationDate(tokenResponse),
            },
            authType: AuthType.OPEN_ID,
            expiryTime: Date.now() + this.config.session.ttl,
          };
          if (this.config.openid?.refresh_tokens && tokenResponse.refreshToken) {
            Object.assign(sessionStorage.credentials, {
              refresh_token: tokenResponse.refreshToken,
            });
          }

          setExtraAuthStorage(
            request,
            `Bearer ${tokenResponse.idToken}`,
            this.getExtraAuthStorageOptions(context.security_plugin.logger)
          );

          this.sessionStorageFactory.asScoped(request).set(sessionStorage);
          return response.redirected({
            headers: {
              location: nextUrl,
            },
          });
        } catch (error: any) {
          context.security_plugin.logger.error(`OpenId authentication failed: ${error}`);
          if (error.toString().toLowerCase().includes('authentication exception')) {
            return response.unauthorized();
          } else {
            return this.redirectToLogin(request, response);
          }
        }
      }
    );

    this.router.get(
      {
        path: OPENID_AUTH_LOGOUT,
        validate: false,
      },
      async (context, request, response) => {
        const cookie = await this.sessionStorageFactory.asScoped(request).get();
        let tokenFromExtraStorage = '';

        const extraAuthStorageOptions: ExtraAuthStorageOptions = this.getExtraAuthStorageOptions(
          context.security_plugin.logger
        );

        if (cookie?.credentials?.authHeaderValueExtra) {
          tokenFromExtraStorage = getExtraAuthStorageValue(request, extraAuthStorageOptions);
        }

        clearSplitCookies(request, extraAuthStorageOptions);
        this.sessionStorageFactory.asScoped(request).clear();

        // authHeaderValue is the bearer header, e.g. "Bearer <auth_token>"
        const token = tokenFromExtraStorage.length
          ? tokenFromExtraStorage.split(' ')[1]
          : cookie?.credentials.authHeaderValue.split(' ')[1]; // get auth token
        const nextUrl = getBaseRedirectUrl(this.config, this.core, request);

        const logoutQueryParams = {
          post_logout_redirect_uri: `${nextUrl}`,
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
