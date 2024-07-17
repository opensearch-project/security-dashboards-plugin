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

import { map } from 'lodash';
import { HttpStart } from '../../../../../../src/core/public';
import { createRequestContextWithDataSourceId } from './request-utils';
import { API_ENDPOINT_INTERNALUSERS } from '../constants';
import { DataObject, InternalUser, ObjectsMessage } from '../types';
import { getResourceUrl } from './resource-utils';

export interface InternalUsersListing extends InternalUser {
  username: string;
}

export function transformUserData(rawData: DataObject<InternalUser>): InternalUsersListing[] {
  return map(rawData, (value: InternalUser, key?: string) => ({
    username: key || '',
    attributes: value.attributes,
    backend_roles: value.backend_roles,
  }));
}

export async function requestDeleteUsers(http: HttpStart, users: string[], dataSourceId: string) {
  for (const user of users) {
    await createRequestContextWithDataSourceId(dataSourceId).httpDelete({
      http,
      url: getResourceUrl(API_ENDPOINT_INTERNALUSERS, user),
    });
  }
}

export async function getUserListRaw(
  http: HttpStart,
  dataSourceId: string
): Promise<ObjectsMessage<InternalUser>> {
  return await createRequestContextWithDataSourceId(dataSourceId).httpGet<
    ObjectsMessage<InternalUser>
  >({ http, url: API_ENDPOINT_INTERNALUSERS });
}

export async function getUserList(
  http: HttpStart,
  dataSourceId: string
): Promise<InternalUsersListing[]> {
  const rawData = await getUserListRaw(http, dataSourceId);
  return transformUserData(rawData.data);
}

export async function fetchUserNameList(
  http: HttpStart,
  dataSourceId: string
): Promise<string[]> {
  return Object.keys((await getUserListRaw(http, dataSourceId)).data);
}


