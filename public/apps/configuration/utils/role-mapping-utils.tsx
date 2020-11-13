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
import { httpGetWithIgnores, httpPost } from './request-utils';
import { getResourceUrl } from './resource-utils';

export interface MappedUsersListing {
  userName: string;
  userType: string;
}

export enum UserType {
  internal = 'User',
  external = 'Backend role',
}

export async function getRoleMappingData(http: HttpStart, roleName: string) {
  return httpGetWithIgnores<RoleMappingDetail>(
    http,
    getResourceUrl(API_ENDPOINT_ROLESMAPPING, roleName),
    [404]
  );
}

export function transformRoleMappingData(rawData: RoleMappingDetail): MappedUsersListing[] {
  const internalUsers = map(rawData.users, (mappedUser: string) => ({
    userName: mappedUser,
    userType: UserType.internal,
  }));

  const externalIdentity = map(rawData.backend_roles, (mappedExternalIdentity: string) => ({
    userName: mappedExternalIdentity,
    userType: UserType.external,
  }));

  return internalUsers.concat(externalIdentity);
}

export async function updateRoleMapping(
  http: HttpStart,
  roleName: string,
  updateObject: RoleMappingDetail
) {
  return await httpPost(http, getResourceUrl(API_ENDPOINT_ROLESMAPPING, roleName), updateObject);
}
