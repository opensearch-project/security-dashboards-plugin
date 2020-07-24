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
import { API_ENDPOINT_ROLESMAPPING } from '../constants';
import { RoleMappingDetail } from '../types';

export interface MappedUsersListing {
  user_name: string;
  user_type: string;
}

export enum UserType {
  internal = 'Internal user',
  external = 'External identity',
}

export async function getRoleMappingData(http: HttpStart, roleName: string) {
  try {
    const rawData = (await http.get(
      `${API_ENDPOINT_ROLESMAPPING}/${roleName}`
    )) as RoleMappingDetail;
    return transformRoleMappingData(rawData);
  } catch (e) {
    if (e.response.status === 404) return [];
    throw e;
  }
}

export function transformRoleMappingData(rawData: RoleMappingDetail): MappedUsersListing[] {
  const internalUsers = map(rawData.users, (mappedUser: string) => ({
    user_name: mappedUser,
    user_type: UserType.internal,
  }));

  const externalIdentity = map(rawData.backend_roles, (mappedExternalIdentity: string) => ({
    user_name: mappedExternalIdentity,
    user_type: UserType.external,
  }));

  return internalUsers.concat(externalIdentity);
}
