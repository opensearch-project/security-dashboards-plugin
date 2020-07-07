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

import { parse, format } from 'url';
import { get } from 'lodash';
import { ParsedUrlQuery } from 'querystring';
import { SecurityPluginConfigType } from '../../..';
import {
  SessionStorageFactory,
  IRouter,
  IClusterClient,
  CoreSetup,
  AuthenticationHandler,
  KibanaRequest,
} from '../../../../../../src/core/server';
import { SecuritySessionCookie } from '../../../session/security_cookie';
import { SecurityClient } from '../../../backend/opendistro_security_client';
import { User } from '../../user';
import { IAuthenticationType } from '../authentication_type';

export class JwtAuthentication implements IAuthenticationType {
  private static readonly AUTH_TYPE: string = 'jwt';
  private authHeaderName: string;
  private securityClient: SecurityClient;

  constructor(
    private readonly config: SecurityPluginConfigType,
    private readonly sessionStorageFactory: SessionStorageFactory<SecuritySessionCookie>,
    private readonly router: IRouter,
    private readonly esClient: IClusterClient,
    private readonly coreSetup: CoreSetup
  ) {
    this.authHeaderName = this.config.jwt?.header.toLowerCase() || 'authorization';
    this.securityClient = new SecurityClient(esClient);
  }

  authHandler: AuthenticationHandler = async (request, response, tookit) => {
    const jwtToken = this.getJwtToken(request);
    if (jwtToken) {
      const authHeaderValue = `Bearer ${jwtToken}`;
      let user: User;
      try {
        user = await this.securityClient.authenticateWithHeader(
          request,
          this.authHeaderName,
          authHeaderValue
        );
      } catch (error) {
        console.log(error);
        return response.unauthorized();
      }

      const header: any = {};
      header[this.authHeaderName] = authHeaderValue;

      const cookie: SecuritySessionCookie = {
        username: user.username,
        credentials: {
          authHeaderValue,
        },
        authType: JwtAuthentication.AUTH_TYPE,
        expiryTime: Date.now() + this.config.cookie.ttl,
      };
      this.sessionStorageFactory.asScoped(request).set(cookie);

      return tookit.authenticated({
        requestHeaders: header,
      });
    }

    // check if credentials present in cookie
    let cookie;
    try {
      cookie = await this.sessionStorageFactory.asScoped(request).get();
    } catch (error) {
      console.log(error);
    }

    if (cookie) {
      cookie.expiryTime = Date.now() + this.config.cookie.ttl;
      this.sessionStorageFactory.asScoped(request).set(cookie);

      const authHeaderValue = cookie.credentials.authHeaderValue;
      if (authHeaderValue) {
        const header: any = {};
        header[this.authHeaderName] = authHeaderValue;
        return tookit.authenticated({
          requestHeaders: header,
        });
      }
    }

    // no credentials in query parameter, header, or cookie,
    // redirect to login url if there is one
    const loginEndpoint = this.config.jwt?.login_endpoint;
    if (loginEndpoint) {
      const loginUrl = parse(loginEndpoint, true);
      let nextUrl: string = get(loginUrl.query, 'nexturl');
      if (!nextUrl) {
        nextUrl = format(request.url);
        nextUrl = encodeURIComponent(nextUrl);
        Object.assign(loginUrl.query, { nextUrl });
      }
      tookit.redirected({
        location: format(loginUrl),
      });
    }

    return tookit.notHandled(); // TODO: need to work with browser side to redirect to error page
  };

  private getJwtToken(request: KibanaRequest): string | undefined {
    let token: string | undefined;

    // try to extract JWT token from url query parameters
    const urlParamName = this.config.jwt?.url_param;
    if (urlParamName) {
      token = (request.url.query as ParsedUrlQuery)[urlParamName] as string;
      if (token) {
        return token;
      }
    }

    // fallback to HTTP header
    const authHeaderValue = request.headers[this.authHeaderName];
    // authHeaderValue should not be array, to ensure client doesn't pass multiple auth header
    if (authHeaderValue && !Array.isArray(authHeaderValue)) {
      return authHeaderValue;
    }

    return token;
  }
}
