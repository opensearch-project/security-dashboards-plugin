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

import { HttpStart } from 'opensearch-dashboards/public';
import { API_ENDPOINT_INTERNALUSERS } from '../constants';
import { InternalUser, InternalUserUpdate } from '../types';
import { createRequestContextWithDataSourceId } from './request-utils';
import { getResourceUrl } from './resource-utils';

export async function getUserDetail(
  http: HttpStart,
  username: string,
  dataSourceId: string
): Promise<InternalUser> {
  return await createRequestContextWithDataSourceId(dataSourceId).httpGet<InternalUser>({
    http,
    url: getResourceUrl(API_ENDPOINT_INTERNALUSERS, username),
  });
}

export async function updateUser(
  http: HttpStart,
  username: string,
  updateObject: InternalUserUpdate,
  dataSourceId: string
): Promise<InternalUser> {
  return await createRequestContextWithDataSourceId(dataSourceId).httpPost({
    http,
    url: getResourceUrl(API_ENDPOINT_INTERNALUSERS, username),
    body: updateObject,
  });
}
