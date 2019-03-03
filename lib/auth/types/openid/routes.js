/*
 * Copyright 2015-2018 _floragunn_ GmbH
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */
/*
 * Portions Copyright 2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License").
 * You may not use this file except in compliance with the License.
 * A copy of the License is located at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * or in the "license" file accompanying this file. This file is distributed
 * on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either
 * express or implied. See the License for the specific language governing
 * permissions and limitations under the License.
 */

import Boom from 'boom';
import {parseNextUrl} from '../../parseNextUrl'
import MissingTenantError from "../../errors/missing_tenant_error";

module.exports = function (pluginRoot, server, kbnServer, APP_ROOT, API_ROOT, openIdEndPoints) {

    const AuthenticationError = pluginRoot('lib/auth/errors/authentication_error');
    const config = server.config();
    const basePath = config.get('server.basePath');
    const customErrorApp = server.getHiddenUiAppById('security-customerror');

    const routesPath = '/auth/openid/';

    // OpenId config
    const clientId = config.get('opendistro_security.openid.client_id');
    const clientSecret = config.get('opendistro_security.openid.client_secret');

    // Scope must include "openid"
    // Other available scopes as per the spec: https://openid.net/specs/openid-connect-core-1_0.html#ScopeClaims
    let scope = config.get('opendistro_security.openid.scope').split(' ');
    if (scope.indexOf('openid') === -1) {
        scope.push('openid');
    }

    /**
     * The redirect uri can't always be resolved automatically.
     * Instead, we have the opendistro_security.openid.base_redirect_uri config option.
     * @returns {*}
     */
    function getBaseRedirectUrl() {
        const configuredBaseRedirectUrl = config.get('opendistro_security.openid.base_redirect_url');
        if (configuredBaseRedirectUrl) {
            return (configuredBaseRedirectUrl.endsWith('/')) ? configuredBaseRedirectUrl.slice(0, -1) : configuredBaseRedirectUrl;
        }

        // Config option not used, try to get the correct protocol and host
        let host = config.get('server.host');
        let port = config.get('server.port');
        if (port) {
            host = host + ':' + port;
        }

        return `${server.info.protocol}://${host}`;
    }

    /**
     * Error handler for the cases where we can't catch errors while obtaining the token.
     * Mainly happens when Wreck within Bell
     */
    server.ext('onPreResponse', function(request, reply) {
        // Make sure we only handle errors for the login route
        if (request.response.isBoom && request.path.indexOf(`${APP_ROOT}${routesPath}login`) > -1 && request.response.output.statusCode === 500) {
            return reply.redirect(basePath + '/customerror?type=authError');
        }

        reply.continue();
    });

    // Register bell with the server
    server.register(require('bell'), function (err) {
        let baseRedirectUrl = getBaseRedirectUrl();
        let location = `${baseRedirectUrl}${basePath}`;

        server.auth.strategy('customOAuth', 'bell', {
            provider: {
                auth: openIdEndPoints.authorization_endpoint,
                token: openIdEndPoints.token_endpoint,
                scope: scope,
                protocol: 'oauth2',
                useParamsAuth: true,
            },
            skipProfile: true,
            location: encodeURI(location),
            password: config.get('opendistro_security.cookie.password'),
            clientId: clientId,
            clientSecret: clientSecret,
            isSecure: config.get('opendistro_security.cookie.secure'),
        });


        /**
         * The login page.
         */
        server.route({
            method: ['GET', 'POST'],
            path: `${APP_ROOT}${routesPath}login`,
            config: {
                auth: 'customOAuth'
            },
            handler: {
                async: async (request, reply) => {
                    if (!request.auth.isAuthenticated) {
                        return reply.redirect(basePath + '/customerror?type=authError');
                    }

                    let credentials = request.auth.credentials;

                    let nextUrl = (credentials.query && credentials.query.nextUrl) ? credentials.query.nextUrl : null;

                    try {
                        // Bell gives us the access token to identify with here,
                        // but we want the id_token returned from the IDP
                        let {user} = await request.auth.securitySessionStorage.authenticate({
                            authHeaderValue: 'Bearer ' + request.auth.artifacts['id_token']
                        });

                        if (nextUrl) {
                            nextUrl = parseNextUrl(nextUrl, basePath);
                            return reply.redirect(nextUrl);
                        }

                        return reply.redirect(basePath + '/app/kibana');
                    }
                    catch (error) {
                        if (error instanceof AuthenticationError) {
                            return reply.redirect(basePath + '/customerror?type=authError');
                        } else if (error instanceof MissingTenantError) {
                            return reply.redirect(basePath + '/customerror?type=missingTenant');
                        } else {
                            return reply.redirect(basePath + '/customerror?type=authError');
                        }
                    }
                }
            }
        });
    });

    /**
     * The error page.
     */
    server.route({
        method: 'GET',
        path:  `${APP_ROOT}/customerror`,
        handler(request, reply) {
            return reply.renderAppWithDefaultConfig(customErrorApp);
        },
        config: {
            auth: false
        }
    });

    /**
     * Clears the session and logs the user out from the IdP (if we have an endpoint available)
     * @url http://openid.net/specs/openid-connect-session-1_0.html#RPLogout
     */
    server.route({
        method: 'POST',
        path: `${API_ROOT}/auth/logout`,
        handler: (request, reply) => {
            request.auth.securitySessionStorage.clear();

            // Build the redirect uri needed by the provider
            let baseRedirectUrl = getBaseRedirectUrl();
            // Unfortunately, it seems like the cookie plugin isn't available yet,
            // which means that we can't use the new plugin
            const cookieName = config.get('opendistro_security.cookie.name');
            // Get the session credentials and remove "Bearer " from the value
            const token = request.state[cookieName].credentials.authHeaderValue.split(' ')[1];
            let requestQueryParameters = `?post_logout_redirect_uri=${baseRedirectUrl}${basePath}/app/kibana`;

            // If we don't have an "end_session_endpoint" in the .well-known list,
            // we may have a custom logout_url defined in the config.
            // The custom url trumps the .well-known endpoint if both are available.
            let customLogoutUrl = config.get('opendistro_security.openid.logout_url');
            let endSessionUrl = null
            if (customLogoutUrl) {
                // Pass the post_logout_uri just in case, but not the token
                endSessionUrl = customLogoutUrl + requestQueryParameters;
            } else if (openIdEndPoints.end_session_endpoint) {
                endSessionUrl = openIdEndPoints.end_session_endpoint + requestQueryParameters + '&id_token_hint=' + token;
            }

            reply({redirectURL: endSessionUrl});
        },
        config: {
            auth: false
        }
    });

}; //end module
