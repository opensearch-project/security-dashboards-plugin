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

export interface InternalUsersListing extends InternalUser {
  username: string;
}

export function transformUserData(rawData: DataObject<InternalUser>): InternalUsersListing[] {
  return map(
    rawData,
    (value: InternalUser, key?: string) =>
      ({
        username: key,
        attributes: value.attributes,
      } as InternalUsersListing)
  );
}

export async function requestDeleteUsers(http: HttpStart, users: string[]) {
  users.forEach(async (r) => {
    await http.delete(`${API_ENDPOINT_INTERNALUSERS}/${r}`);
  });
}

async function getUserListRaw(http: HttpStart) {
  return (await http.get(`${API_ENDPOINT_INTERNALUSERS}`)) as ObjectsMessage<InternalUser>;
}

export async function getUserList(http: HttpStart) {
  const rawData = await getUserListRaw(http);
  return transformUserData(rawData.data);
}
