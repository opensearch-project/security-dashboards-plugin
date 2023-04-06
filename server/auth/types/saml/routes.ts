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
import { IRouter, SessionStorageFactory, Logger } from '../../../../../../src/core/server';
import { SecuritySessionCookie } from '../../../session/security_cookie';
import { SecurityPluginConfigType } from '../../..';
import { SecurityClient } from '../../../backend/opensearch_security_client';
import { CoreSetup } from '../../../../../../src/core/server';
import { validateNextUrl } from '../../../utils/next_url';
import { AuthType, SAML_AUTH_LOGIN, SAML_AUTH_LOGOUT } from '../../../../common';

import {
  clearSplitCookies,
  ExtraAuthStorageOptions,
  setExtraAuthStorage,
} from '../../../session/cookie_splitter';

export class SamlAuthRoutes {
  constructor(
    private readonly router: IRouter,
    // @ts-ignore: unused variable
    private readonly config: SecurityPluginConfigType,
    private readonly sessionStorageFactory: SessionStorageFactory<SecuritySessionCookie>,
    private readonly securityClient: SecurityClient,
    private readonly coreSetup: CoreSetup
  ) {}

  private getExtraAuthStorageOptions(logger?: Logger): ExtraAuthStorageOptions {
    // If we're here, we will always have the openid configuration
    return {
      cookiePrefix: this.config.saml.extra_storage.cookie_prefix,
      additionalCookies: this.config.saml.extra_storage.additional_cookies,
      logger,
    };
  }

  public setupRoutes() {
    this.router.get(
      {
        path: SAML_AUTH_LOGIN,
        validate: {
          query: schema.object({
            nextUrl: schema.maybe(
              schema.string({
                validate: validateNextUrl,
              })
            ),
            redirectHash: schema.string(),
          }),
        },
        options: {
          authRequired: false,
        },
      },
      async (context, request, response) => {
        if (request.auth.isAuthenticated) {
          return response.redirected({
            headers: {
              location: `${this.coreSetup.http.basePath.serverBasePath}/app/opensearch-dashboards`,
            },
          });
        }

        try {
          const samlHeader = await this.securityClient.getSamlHeader(request);
          // const { nextUrl = '/' } = request.query;
          const cookie: SecuritySessionCookie = {
            saml: {
              nextUrl: request.query.nextUrl,
              requestId: samlHeader.requestId,
              redirectHash: request.query.redirectHash === 'true',
            },
          };
          this.sessionStorageFactory.asScoped(request).set(cookie);
          return response.redirected({
            headers: {
              location: samlHeader.location,
            },
          });
        } catch (error) {
          context.security_plugin.logger.error(`Failed to get saml header: ${error}`);
          return response.internalError(); // TODO: redirect to error page?
        }
      }
    );

    this.router.post(
      {
        path: `/_opendistro/_security/saml/acs`,
        validate: {
          body: schema.any(),
        },
        options: {
          authRequired: false,
        },
      },
      async (context, request, response) => {
        let requestId: string = '';
        let nextUrl: string = '/';
        let redirectHash: boolean = false;
        try {
          const cookie = await this.sessionStorageFactory.asScoped(request).get();
          if (cookie) {
            requestId = cookie.saml?.requestId || '';
            nextUrl =
              cookie.saml?.nextUrl ||
              `${this.coreSetup.http.basePath.serverBasePath}/app/opensearch-dashboards`;
            redirectHash = cookie.saml?.redirectHash || false;
          }
          if (!requestId) {
            return response.badRequest({
              body: 'Invalid requestId',
            });
          }
        } catch (error) {
          context.security_plugin.logger.error(`Failed to parse cookie: ${error}`);
          return response.badRequest();
        }

        try {
          const credentials = await this.securityClient.authToken(
            requestId,
            request.body.SAMLResponse,
            undefined
          );
          const user = await this.securityClient.authenticateWithHeader(
            request,
            'authorization',
            credentials.authorization
          );

          let expiryTime = Date.now() + this.config.session.ttl;
          const [headerEncoded, payloadEncoded, signature] = credentials.authorization.split('.');
          if (!payloadEncoded) {
            context.security_plugin.logger.error('JWT token payload not found');
          }
          const tokenPayload = JSON.parse(Buffer.from(payloadEncoded, 'base64').toString());

          if (tokenPayload.exp) {
            expiryTime = parseInt(tokenPayload.exp, 10) * 1000;
          }

          const cookie: SecuritySessionCookie = {
            username: user.username,
            credentials: {
              authHeaderValueExtra: true,
            },
            authType: AuthType.SAML, // TODO: create constant
            expiryTime,
          };

          setExtraAuthStorage(
            request,
            credentials.authorization,
            this.getExtraAuthStorageOptions(context.security_plugin.logger)
          );

          this.sessionStorageFactory.asScoped(request).set(cookie);

          if (redirectHash) {
            return response.redirected({
              headers: {
                location: `${
                  this.coreSetup.http.basePath.serverBasePath
                }/auth/saml/redirectUrlFragment?nextUrl=${escape(nextUrl)}`,
              },
            });
          } else {
            return response.redirected({
              headers: {
                location: nextUrl,
              },
            });
          }
        } catch (error) {
          context.security_plugin.logger.error(
            `SAML SP initiated authentication workflow failed: ${error}`
          );
        }

        return response.internalError();
      }
    );

    this.router.post(
      {
        path: `/_opendistro/_security/saml/acs/idpinitiated`,
        validate: {
          body: schema.any(),
        },
        options: {
          authRequired: false,
        },
      },
      async (context, request, response) => {
        const acsEndpoint = `${this.coreSetup.http.basePath.serverBasePath}/_opendistro/_security/saml/acs/idpinitiated`;
        try {
          const credentials = await this.securityClient.authToken(
            undefined,
            request.body.SAMLResponse,
            acsEndpoint
          );
          const user = await this.securityClient.authenticateWithHeader(
            request,
            'authorization',
            credentials.authorization
          );

          let expiryTime = Date.now() + this.config.session.ttl;
          const [headerEncoded, payloadEncoded, signature] = credentials.authorization.split('.');
          if (!payloadEncoded) {
            context.security_plugin.logger.error('JWT token payload not found');
          }
          const tokenPayload = JSON.parse(Buffer.from(payloadEncoded, 'base64').toString());
          if (tokenPayload.exp) {
            expiryTime = parseInt(tokenPayload.exp, 10) * 1000;
          }

          const cookie: SecuritySessionCookie = {
            username: user.username,
            credentials: {
              authHeaderValueExtra: true,
            },
            authType: AuthType.SAML, // TODO: create constant
            expiryTime,
          };

          setExtraAuthStorage(
            request,
            credentials.authorization,
            this.getExtraAuthStorageOptions(context.security_plugin.logger)
          );

          this.sessionStorageFactory.asScoped(request).set(cookie);
          return response.redirected({
            headers: {
              location: `${this.coreSetup.http.basePath.serverBasePath}/app/opensearch-dashboards`,
            },
          });
        } catch (error) {
          context.security_plugin.logger.error(
            `SAML IDP initiated authentication workflow failed: ${error}`
          );
        }
        return response.internalError();
      }
    );

    // captureUrlFragment is the first route that will be invoked in the SP initiated login.
    // This route will execute the captureUrlFragment.js script.
    this.coreSetup.http.resources.register(
      {
        path: '/auth/saml/captureUrlFragment',
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
          authRequired: false,
        },
      },
      async (context, request, response) => {
        this.sessionStorageFactory.asScoped(request).clear();
        const serverBasePath = this.coreSetup.http.basePath.serverBasePath;
        return response.renderHtml({
          body: `
            <!DOCTYPE html>
            <title>OSD SAML Capture</title>
            <link rel="icon" href="data:,">
            <script src="${serverBasePath}/auth/saml/captureUrlFragment.js"></script>
          `,
        });
      }
    );

    // This script will store the URL Hash in browser's local storage.
    this.coreSetup.http.resources.register(
      {
        path: '/auth/saml/captureUrlFragment.js',
        validate: false,
        options: {
          authRequired: false,
        },
      },
      async (context, request, response) => {
        this.sessionStorageFactory.asScoped(request).clear();
        return response.renderJs({
          body: `let samlHash=window.location.hash.toString();
                 let redirectHash = false;
                 if (samlHash !== "") {
                    window.localStorage.removeItem('samlHash');
                    window.localStorage.setItem('samlHash', samlHash);
                     redirectHash = true;
                  }
                 let params = new URLSearchParams(window.location.search);
                 let nextUrl = params.get("nextUrl");
                 finalUrl = "login?nextUrl=" + encodeURIComponent(nextUrl);
                 finalUrl += "&redirectHash=" + encodeURIComponent(redirectHash);
                 window.location.replace(finalUrl);
                `,
        });
      }
    );

    //  Once the User is authenticated via the '_opendistro/_security/saml/acs' route,
    //  the browser will be redirected to '/auth/saml/redirectUrlFragment' route,
    //  which will execute the redirectUrlFragment.js.
    this.coreSetup.http.resources.register(
      {
        path: '/auth/saml/redirectUrlFragment',
        validate: {
          query: schema.object({
            nextUrl: schema.any(),
          }),
        },
        options: {
          authRequired: true,
        },
      },
      async (context, request, response) => {
        const serverBasePath = this.coreSetup.http.basePath.serverBasePath;
        return response.renderHtml({
          body: `
            <!DOCTYPE html>
            <title>OSD SAML Success</title>
            <link rel="icon" href="data:,">
            <script src="${serverBasePath}/auth/saml/redirectUrlFragment.js"></script>
          `,
        });
      }
    );

    // This script will pop the Hash from local storage if it exists.
    // And forward the browser to the next url.
    this.coreSetup.http.resources.register(
      {
        path: '/auth/saml/redirectUrlFragment.js',
        validate: false,
        options: {
          authRequired: true,
        },
      },
      async (context, request, response) => {
        return response.renderJs({
          body: `let samlHash=window.localStorage.getItem('samlHash');
                 window.localStorage.removeItem('samlHash');
                 let params = new URLSearchParams(window.location.search);
                 let nextUrl = params.get("nextUrl");
                 finalUrl = nextUrl + samlHash;
                 window.location.replace(finalUrl);
                `,
        });
      }
    );

    this.router.get(
      {
        path: SAML_AUTH_LOGOUT,
        validate: false,
      },
      async (context, request, response) => {
        try {
          const authInfo = await this.securityClient.authinfo(request);
          await clearSplitCookies(
            request,
            this.getExtraAuthStorageOptions(context.security_plugin.logger)
          );
          this.sessionStorageFactory.asScoped(request).clear();
          // TODO: need a default logout page
          const redirectUrl =
            authInfo.sso_logout_url || this.coreSetup.http.basePath.serverBasePath || '/';
          return response.redirected({
            headers: {
              location: redirectUrl,
            },
          });
        } catch (error) {
          context.security_plugin.logger.error(`SAML logout failed: ${error}`);
          return response.badRequest();
        }
      }
    );
  }
}
