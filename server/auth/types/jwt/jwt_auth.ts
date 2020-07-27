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

import { ParsedUrlQuery } from 'querystring';
import {
  SessionStorageFactory,
  IRouter,
  ILegacyClusterClient,
  CoreSetup,
  KibanaRequest,
  Logger,
  LifecycleResponseFactory,
  AuthToolkit,
  IKibanaResponse,
} from 'kibana/server';
import { SecurityPluginConfigType } from '../../..';
import { SecuritySessionCookie } from '../../../session/security_cookie';
import { IAuthenticationType, AuthenticationType } from '../authentication_type';

export class JwtAuthentication extends AuthenticationType implements IAuthenticationType {
  public readonly type: string = 'jwt';

  private authHeaderName: string;

  constructor(
    config: SecurityPluginConfigType,
    sessionStorageFactory: SessionStorageFactory<SecuritySessionCookie>,
    router: IRouter,
    esClient: ILegacyClusterClient,
    coreSetup: CoreSetup,
    logger: Logger
  ) {
    super(config, sessionStorageFactory, router, esClient, coreSetup, logger);
    this.authHeaderName = this.config.jwt?.header.toLowerCase() || 'authorization';
  }

  private getBearerToken(request: KibanaRequest): string | undefined {
    const urlParamName = this.config.jwt?.url_param;
    if (urlParamName) {
      const token = (request.url.query as ParsedUrlQuery)[urlParamName];
      if (token) {
        return `Bearer ${token}`;
      }
    }

    return (request.headers[this.authHeaderName] as string) || undefined;
  }

  protected requestIncludesAuthInfo(
    request: KibanaRequest<unknown, unknown, unknown, any>
  ): boolean {
    if (request.headers[this.authHeaderName]) {
      return true;
    }

    const urlParamName = this.config.jwt?.url_param;
    if (urlParamName && (request.url.query as ParsedUrlQuery)[urlParamName]) {
      return true;
    }

    return false;
  }

  protected getAdditionalAuthHeader(request: KibanaRequest<unknown, unknown, unknown, any>) {
    const header: any = {};
    const urlParamName = this.config.jwt?.url_param;
    if (urlParamName) {
      const token = (request.url.query as ParsedUrlQuery)[urlParamName] as string;
      if (token) {
        header[this.authHeaderName] = `Bearer ${token}`;
        return header;
      }
    }
    return {};
  }
  protected getCookie(
    request: KibanaRequest<unknown, unknown, unknown, any>,
    authInfo: any
  ): SecuritySessionCookie {
    return {
      username: authInfo.user_name,
      credentials: {
        authHeaderValue: this.getBearerToken(request),
      },
      authType: this.type,
      expiryTime: Date.now() + this.config.cookie.ttl,
    };
  }

  isValidCookie(cookie: SecuritySessionCookie): boolean {
    return (
      cookie.authType === this.type &&
      cookie.username &&
      cookie.expiryTime &&
      cookie.credentials?.authHeaderValue
    );
  }

  redirectToAuth(
    request: KibanaRequest,
    response: LifecycleResponseFactory,
    toolkit: AuthToolkit
  ): IKibanaResponse {
    return response.unauthorized();
  }

  buildAuthHeaderFromCookie(cookie: SecuritySessionCookie): any {
    const header: any = {};
    const authHeaderValue = cookie.credentials?.authHeaderValue;
    if (authHeaderValue) {
      header[this.authHeaderName] = authHeaderValue;
    }
    return header;
  }
}
