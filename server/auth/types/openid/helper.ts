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

import wreck from '@hapi/wreck';
import { parse, stringify } from 'querystring';
import { CoreSetup } from 'kibana/server';
import { SecurityPluginConfigType } from '../../..';

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

export function getBaseRedirectUrl(config: SecurityPluginConfigType, core: CoreSetup): string {
  if (config.openid?.base_redirect_url) {
    const baseRedirectUrl = config.openid.base_redirect_url;
    return baseRedirectUrl.endsWith('/') ? baseRedirectUrl.slice(0, -1) : baseRedirectUrl;
  }

  const host = core.http.getServerInfo().hostname;
  const port = core.http.getServerInfo().port;
  const protocol = core.http.getServerInfo().protocol;
  if (core.http.basePath.serverBasePath) {
    return `${protocol}://${host}:${port}${core.http.basePath.serverBasePath}`;
  }
  return `${protocol}://${host}:${port}`;
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

export interface TokenResponse {
  idToken?: string;
  accessToken?: string;
  refreshToken?: string;
  expiresIn?: number;
}
