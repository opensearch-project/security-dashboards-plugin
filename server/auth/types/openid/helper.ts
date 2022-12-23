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

import wreck from '@hapi/wreck';
import { parse, stringify } from 'querystring';
import { CoreSetup } from 'opensearch-dashboards/server';
import { SecurityPluginConfigType } from '../../..';
import { OpenSearchDashboardsRequest } from '../../../../../../src/core/server';

export function parseTokenResponse(payload: Buffer) {
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

export function getRootUrl(
  config: SecurityPluginConfigType,
  core: CoreSetup,
  request: OpenSearchDashboardsRequest
): string {
  const host = core.http.getServerInfo().hostname;
  const port = core.http.getServerInfo().port;
  let protocol = core.http.getServerInfo().protocol;
  let httpHost = `${host}:${port}`;

  if (config.openid?.trust_dynamic_headers) {
    const xForwardedHost = (request.headers['x-forwarded-host'] as string) || undefined;
    const xForwardedProto = (request.headers['x-forwarded-proto'] as string) || undefined;
    if (xForwardedHost) {
      httpHost = xForwardedHost;
    }
    if (xForwardedProto) {
      protocol = xForwardedProto;
    }
  }

  return `${protocol}://${httpHost}`;
}

export function getBaseRedirectUrl(
  config: SecurityPluginConfigType,
  core: CoreSetup,
  request: OpenSearchDashboardsRequest
): string {
  if (config.openid?.base_redirect_url) {
    const baseRedirectUrl = config.openid.base_redirect_url;
    return baseRedirectUrl.endsWith('/') ? baseRedirectUrl.slice(0, -1) : baseRedirectUrl;
  }

  const rootUrl = getRootUrl(config, core, request);
  if (core.http.basePath.serverBasePath) {
    return `${rootUrl}${core.http.basePath.serverBasePath}`;
  }
  return rootUrl;
}

export function getNextUrl(
  config: SecurityPluginConfigType,
  core: CoreSetup,
  request: OpenSearchDashboardsRequest
): string {
  return request.query.nextUrl || getBaseRedirectUrl(config, core, request) || '/';
}

export async function callTokenEndpoint(
  tokenEndpoint: string,
  query: any,
  wreckClient: typeof wreck
): Promise<TokenResponse> {
  const tokenResponse = await wreckClient.post(tokenEndpoint, {
    payload: stringify(query),
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });
  if (
    !tokenResponse.res?.statusCode ||
    tokenResponse.res.statusCode < 200 ||
    tokenResponse.res.statusCode > 299
  ) {
    throw new Error(
      `Failed calling token endpoint: ${tokenResponse.res.statusCode} ${tokenResponse.res.statusMessage}`
    );
  }
  const tokenPayload: any = parseTokenResponse(tokenResponse.payload as Buffer);
  return {
    idToken: tokenPayload.id_token,
    accessToken: tokenPayload.access_token,
    refreshToken: tokenPayload.refresh_token,
    expiresIn: tokenPayload.expires_in,
  };
}

export function composeLogoutUrl(
  customLogoutUrl: string | undefined,
  idpEndsessionEndpoint: string | undefined,
  additionalQueryParams: any
) {
  const logoutEndpont = customLogoutUrl || idpEndsessionEndpoint;
  const logoutUrl = new URL(logoutEndpont!);
  Object.keys(additionalQueryParams).forEach((key) => {
    logoutUrl.searchParams.append(key, additionalQueryParams[key] as string);
  });
  return logoutUrl.toString();
}

export interface TokenResponse {
  idToken?: string;
  accessToken?: string;
  refreshToken?: string;
  expiresIn?: number;
}

export function getExpirationDate(tokenResponse: TokenResponse | undefined) {
  if (!tokenResponse) {
    throw new Error('Invalid token');
  } else if (tokenResponse.idToken) {
    const idToken = tokenResponse.idToken;
    const parts = idToken.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid token');
    }
    const claim = JSON.parse(Buffer.from(parts[1], 'base64').toString());
    return claim.exp * 1000;
  } else {
    return Date.now() + tokenResponse.expiresIn! * 1000;
  }
}
