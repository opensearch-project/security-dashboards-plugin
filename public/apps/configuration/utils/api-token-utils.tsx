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

import { HttpStart } from '../../../../../../src/core/public';
import { API_ENDPOINT_APITOKENS } from '../constants';
import { ApiToken, ApiTokenIndexPermission } from '../types';
import { createRequestContextWithDataSourceId } from './request-utils';

export interface ApiTokenCreateRequest {
  name: string;
  cluster_permissions: string[];
  index_permissions: ApiTokenIndexPermission[];
  expiration?: number;
}

export interface ApiTokenCreateResponse {
  id: string;
  token: string;
}

export async function listApiTokens(http: HttpStart, dataSourceId: string): Promise<ApiToken[]> {
  return await createRequestContextWithDataSourceId(dataSourceId).httpGet<ApiToken[]>({
    http,
    url: API_ENDPOINT_APITOKENS,
  });
}

export async function createApiToken(
  http: HttpStart,
  tokenRequest: ApiTokenCreateRequest,
  dataSourceId: string
): Promise<ApiTokenCreateResponse> {
  return await createRequestContextWithDataSourceId(dataSourceId).httpPost<ApiTokenCreateResponse>({
    http,
    url: API_ENDPOINT_APITOKENS,
    body: tokenRequest,
  });
}

export async function revokeApiToken(
  http: HttpStart,
  tokenId: string,
  dataSourceId: string
): Promise<void> {
  await createRequestContextWithDataSourceId(dataSourceId).httpDelete({
    http,
    url: `${API_ENDPOINT_APITOKENS}/${encodeURIComponent(tokenId)}`,
  });
}

export async function requestRevokeApiTokens(
  http: HttpStart,
  tokenIds: string[],
  dataSourceId: string
): Promise<void> {
  for (const tokenId of tokenIds) {
    await revokeApiToken(http, tokenId, dataSourceId);
  }
}
