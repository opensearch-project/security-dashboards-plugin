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

import { map } from 'lodash';
import { HttpStart } from '../../../../../../src/core/public';
import { API_ENDPOINT_INTERNALUSERS } from '../constants';
import { DataObject, InternalUser, ObjectsMessage } from '../types';
import { httpDelete, httpGet } from './request-utils';
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

export async function requestDeleteUsers(http: HttpStart, users: string[]) {
  for (const user of users) {
    await httpDelete(http, getResourceUrl(API_ENDPOINT_INTERNALUSERS, user));
  }
}

async function getUserListRaw(http: HttpStart): Promise<ObjectsMessage<InternalUser>> {
  return await httpGet<ObjectsMessage<InternalUser>>(http, API_ENDPOINT_INTERNALUSERS);
}

export async function getUserList(http: HttpStart): Promise<InternalUsersListing[]> {
  const rawData = await getUserListRaw(http);
  return transformUserData(rawData.data);
}

export async function fetchUserNameList(http: HttpStart): Promise<string[]> {
  return Object.keys((await getUserListRaw(http)).data);
}
