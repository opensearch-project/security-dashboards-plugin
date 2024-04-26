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
import { API_ENDPOINT_ROLES } from '../constants';
import { RoleDetail, RoleUpdate } from '../types';
import { createRequestContextWithDataSourceId } from './request-utils';
import { getResourceUrl } from './resource-utils';

export async function getRoleDetail(
  http: HttpStart,
  roleName: string,
  dataSourceId: string
): Promise<RoleDetail> {
  return await createRequestContextWithDataSourceId(dataSourceId).httpGet<RoleDetail>({
    http,
    url: getResourceUrl(API_ENDPOINT_ROLES, roleName),
  });
}

export async function updateRole(
  http: HttpStart,
  roleName: string,
  updateObject: RoleUpdate,
  dataSourceId: string
) {
  return await createRequestContextWithDataSourceId(dataSourceId).httpPost({
    http,
    url: getResourceUrl(API_ENDPOINT_ROLES, roleName),
    body: updateObject,
  });
}
