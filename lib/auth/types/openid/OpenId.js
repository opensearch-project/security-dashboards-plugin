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

import AuthType from "../AuthType";
import MissingTenantError from "../../errors/missing_tenant_error";
import AuthenticationError from "../../errors/authentication_error";
import MissingRoleError from "../../errors/missing_role_error";
import InvalidSessionError from "../../errors/invalid_session_error";
import SessionExpiredError from "../../errors/session_expired_error";
const Wreck = require('wreck');
const https = require('https');
const fs = require('fs');
const Boom = require('boom');

export default class OpenId extends AuthType {

    constructor(pluginRoot, server, kbnServer, APP_ROOT, API_ROOT) {

        super(pluginRoot, server, kbnServer, APP_ROOT, API_ROOT);

        /**
         * The authType is saved in the auth cookie for later reference
         * @type {string}
         */
        this.type = 'openid';
        const config = server.config();
        this.clientId = config.get('opendistro_security.openid.client_id');
        this.clientSecret = config.get('opendistro_security.openid.client_secret');

        this.connectUrl = '';
        this.parsedPayload = {};

        // support for self signed certificates: root ca and verify hostname
        const options = {};

        if (this.config.get('opendistro_security.openid.root_ca')) {
            options.ca = [ fs.readFileSync(this.config.get('opendistro_security.openid.root_ca')) ]
        }

        if (this.config.get('opendistro_security.openid.verify_hostnames') == false) {
            // do not check identity
            options.checkServerIdentity = function(host, cert) {}
        }

        if (options.ca || options.checkServerIdentity) {
            Wreck.agents.https = new https.Agent(options);
        }

        try {
            this.authHeaderName = this.config.get('opendistro_security.openid.header').toLowerCase();
        } catch(error) {
            this.kbnServer.status.yellow('No authorization header name defined for OpenId, using "authorization"');
            this.authHeaderName = 'authorization'
        }
    }

    setupAuthScheme() {
        this.server.auth.scheme('security_access_control_scheme', (server, options) => ({
            authenticate: async (request, h) => {
                let credentials = null;

                if (this.routesToIgnore.includes(request.path)) {
                    return h.continue;
                }

                // let configured routes that are not under our control pass,
                // for example /api/status to check Kibana status without a logged in user
                if (this.unauthenticatedRoutes.includes(request.path)) {
                    credentials = this.server.plugins.opendistro_security.getSecurityBackend().getServerUser();
                    return h.authenticated({ credentials });
                };

                try {
                    credentials = await this.server.auth.test('security_access_control_cookie', request);
                    return h.authenticated({ credentials })
                } catch (error) {
                    let authHeaderCredentials = this.detectAuthHeaderCredentials(request);
                    if (authHeaderCredentials) {
                        try {
                            const { session } = await request.auth.securitySessionStorage.authenticate(authHeaderCredentials);
                            // Returning the session equals setting the values with hapi-auth-cookie@set()
                            return h.authenticated({
                                // Watch out here - hapi-auth-cookie requires us to send back an object with credentials
                                // as a key. Otherwise other values than the credentials will be overwritten
                                credentials: session
                            });
                        } catch (authError) {
                            server.log(['error', 'security'], `AuthError: ${error}`);
                            return this.onUnAuthenticated(request, h, authError).takeover();
                        }
                    }

                    if (request.headers) {
                        // If the session has expired, we may receive ajax requests that can't handle a 302 redirect.
                        // In this case, we trigger a 401 and let the interceptor handle the redirect on the client side.
                        if ((request.headers.accept && request.headers.accept.split(',').indexOf('application/json') > -1)
                            || (request.headers['content-type'] && request.headers['content-type'].indexOf('application/json') > -1)) {
                            return h.response({ message: 'Session expired', redirectTo: 'login' })
                                .code(401)
                                .takeover();
                        }
                    }

                }
                return this.onUnAuthenticated(request, h).takeover();
            }
        }));

        // Activates hapi-auth-cookie for ALL routes, unless
        // a) the route is listed in "unauthenticatedRoutes" or
        // b) the auth option in the route definition is explicitly set to false
        this.server.auth.strategy('security_access_control', 'security_access_control_scheme', this.getCookieConfig());
        this.server.auth.strategy('security_access_control_cookie', 'cookie', this.getCookieConfig());

        this.server.auth.default({
            mode: 'required', // @todo Investigate best mode here
            strategy: 'security_access_control' // This seems to be the only way to apply the strategy to ALL routes, even those defined before we add the strategy.
        });

    }

    async authenticate(credentials) {
        // A "login" can happen when we have a token (as header or as URL parameter but no session,
        // or when we have an existing session, but the passed token does not match what's in the session.
        try {

            let user = await this.server.plugins.opendistro_security.getSecurityBackend().authenticateWithHeader(this.authHeaderName, credentials.authHeaderValue);
            let tokenPayload = {};
            try {
                tokenPayload = JSON.parse(Buffer.from(credentials.authHeaderValue.split('.')[1], 'base64').toString());
            } catch (error) {
                // Something went wrong while parsing the payload, but the user was authenticated correctly.
            }

            let session = {
                username: user.username,
                credentials: credentials,
                authType: this.type
            };

            if (tokenPayload.exp) {
                // The token's exp value trumps the config setting
                this.sessionKeepAlive = false;
                session.exp = parseInt(tokenPayload.exp, 10);
            } else if(this.sessionTTL) {
                session.expiryTime = Date.now() + this.sessionTTL
            }

            return {
                session,
                user
            };

        } catch (error) {
            throw error
        }
    }

    onUnAuthenticated(request, h, error) {

        // If we don't have any tenant we need to show the custom error page
        if (error instanceof MissingTenantError) {
            return h.redirect(this.basePath + '/customerror?type=missingTenant')
        } else if (error instanceof MissingRoleError) {
            return h.redirect(this.basePath + '/customerror?type=missingRole')
        } else if (error instanceof AuthenticationError) {
            return h.redirect(this.basePath + '/customerror?type=authError')
        }

        const nextUrl = encodeURIComponent(request.url.path);
        return h.redirect(`${this.basePath}/auth/openid/login?nextUrl=${nextUrl}`);
    }

    async setupRoutes() {
        this.connectUrl = this.config.get('opendistro_security.openid.connect_url');
        try {
            const { response, payload } = await Wreck.get(this.connectUrl);

            this.parsedPayload = JSON.parse(payload.toString());

            let endPoints = {
                authorization_endpoint: this.parsedPayload.authorization_endpoint,
                token_endpoint: this.parsedPayload.token_endpoint,
                end_session_endpoint: this.parsedPayload.end_session_endpoint || null
            };

            require('./routes')(this.pluginRoot, this.server, this.kbnServer, this.APP_ROOT, this.API_ROOT, endPoints);
        } catch (error) {
            if (error ||
                error.output.statusCode < 200 ||
                error.output.statusCode > 299) {
                if (Boom.isBoom(error)) {
                    throw new Error(`Failed when trying to obtain the endpoints from your IdP. Connect URL: ${connectUrl}, Status Code: ${error.output.statusCode}, Payload: ${error.output.payload}`);
                } else {
                    throw new Error(`Failed when trying to obtain the endpoints from your IdP. Connect URL: ${connectUrl}, Error: ${error}`);
                }
            }
        }
    }

    // Function to send a token refresh request to the IDP
    async refreshTokenRequest (refresh_token) {
        const request = require('request');
        return new Promise((resolve, reject) => {
            request.post({
                url: this.parsedPayload.token_endpoint,
                form: {
                    grant_type: 'refresh_token',
                    client_id: this.clientId,
                    client_secret: this.clientSecret,
                    refresh_token: refresh_token
                }}, (error, response, body) => {
                if (error) {
                    reject(error);
                }
                if (response.statusCode != 200) {
                    reject('Invalid status code <' + response.statusCode + '>' + body);
                }
                resolve(body);
            });
        });
    }

    // Function overriden to check session validation for OpenID Auth
    sessionValidator(server) {
        let validate = async (request, session) => {
            this._cookieValidationError = null;

            if (session.authType !== this.type) {
                this._cookieValidationError = new InvalidSessionError('Invalid session');
                request.auth.securitySessionStorage.clearStorage();
                return { valid: false };
            }

            let differentAuthHeaderCredentials = this.detectAuthHeaderCredentials(request, session.credentials);
            if (differentAuthHeaderCredentials) {
                try {
                    let authResponse = await request.auth.securitySessionStorage.authenticate(differentAuthHeaderCredentials);
                    return { valid: true, credentials: authResponse.session };
                } catch (error) {
                    request.auth.securitySessionStorage.clearStorage();
                    return { valid: false };
                }
            }

            if (session.exp && session.exp <= Math.floor(Date.now() / 1000)) {
                var refreshedSession = {};
                if (session.credentials && session.credentials.refresh_token && session.credentials.refresh_token !== null
                    && session.credentials.refresh_token !== '') {
                    try {
                        let body = await this.refreshTokenRequest(session.credentials.refresh_token);
                        let result = JSON.parse(body);
                        let id_token = result['id_token'];
                        let tokenPayload = JSON.parse(Buffer.from(id_token.split('.')[1], 'base64').toString());
                        refreshedSession.username = tokenPayload['name'];
                        refreshedSession.credentials = {};
                        refreshedSession.credentials.authHeaderValue = 'Bearer ' + id_token;
                        refreshedSession.authType = 'openid';
                        if (tokenPayload.exp) {
                            this.sessionKeepAlive = false;
                            refreshedSession.exp = parseInt(tokenPayload.exp, 10);
                        }
                        let {user} = await request.auth.securitySessionStorage.authenticate({
                            authHeaderValue: 'Bearer ' + id_token,
                            refresh_token: result['refresh_token']
                        });
                        request.state[this.config.get('opendistro_security.cookie.name')] = request._states[this.config.get('opendistro_security.cookie.name')].value ;
                        return { valid: true, credentials: refreshedSession };
                    } catch (error) {
                        this.server.log(['error', 'security'], `Error while refreshing the access token : ${error}`);
                        this._cookieValidationError = new SessionExpiredError('Session expired');
                        request.auth.securitySessionStorage.clearStorage();
                        return { valid: false };
                    }
                } else {
                        this.server.log(['error', 'security'], `Error while fetching refreshToken : ${error}`);
                        this._cookieValidationError = new SessionExpiredError('Session expired');
                        request.auth.securitySessionStorage.clearStorage();
                        return { valid: false };
                    }
            } else if (!session.exp && this.sessionTTL) {
                if (!session.expiryTime || session.expiryTime < Date.now()) {
                    this._cookieValidationError = new SessionExpiredError('Session expired');
                    request.auth.securitySessionStorage.clearStorage();
                    return { valid: false };
                }

                if (this.sessionKeepAlive) {
                    session.expiryTime = Date.now() + this.sessionTTL;
                    request.cookieAuth.set(session);
                }
            }

            return { valid: true, credentials: session };
        };

        return validate;
    }

    // Function overriden to intercept OpenID HAPI request
    registerAssignAuthHeader() {
        this.server.ext('onPreAuth', async (request, h) => {
            try {
                await this.assignAuthHeader(request);
            } catch (error) {
                return h.redirect(this.basePath + '/customerror?type=authError');
            }
            return h.continue;
        });
    }

}
