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

import { map, chain } from 'lodash';
import { HttpStart } from '../../../../../../src/core/public';
import { API_ENDPOINT_ROLES, API_ENDPOINT_ROLESMAPPING } from '../constants';
import { httpDelete, httpDeleteWithIgnores, httpGet } from './request-utils';
import { getResourceUrl } from './resource-utils';

export interface RoleListing {
  roleName: string;
  reserved: boolean;
  clusterPermissions: string[];
  indexPermissions: string[];
  tenantPermissions: string[];
  internalUsers: string[];
  backendRoles: string[];
}

/* 
Input[0] - Role Schema: {
  data: {
    [roleName]: {
      reserved: bool,
      cluster_permissions: [""]
      index_permissions: [{
        index_patterns: [""],
        fls: [""],
        masked_fields: [""],
        allowed_actions: [""]
      }],
      tenant_permissions: [{
        tenant_patterns: [""],
        allowed_actions: [""]
      }]
    }
  }
}

Input[1] - RoleMapping schema: {
  data: {
    [roleName]: {
      reserved,
      backend_roles: [""],
      users: [""]
    }
  }
}
*/
export function transformRoleData(rawRoleData: any, rawRoleMappingData: any): RoleListing[] {
  return map(rawRoleData.data, (v: any, k?: string) => ({
    roleName: k || '',
    reserved: v.reserved,
    clusterPermissions: v.cluster_permissions,
    indexPermissions: chain(v.index_permissions)
      .map('index_patterns')
      .flatten()
      .compact()
      .value() as string[],
    tenantPermissions: chain(v.tenant_permissions)
      .map('tenant_patterns')
      .flatten()
      .compact()
      .value() as string[],
    internalUsers: rawRoleMappingData.data[k || '']?.users || [],
    backendRoles: rawRoleMappingData.data[k || '']?.backend_roles || [],
  }));
}

// Flatten list, remove duplicate and null, sort
export function buildSearchFilterOptions(roleList: any[], attrName: string): Array<{ value: any }> {
  return chain(roleList)
    .map(attrName)
    .flatten()
    .compact()
    .uniq()
    .sortBy()
    .map((e) => ({ value: e }))
    .value();
}

// Submit request to delete given roles. No error handling in this function.
export async function requestDeleteRoles(http: HttpStart, roles: string[]) {
  for (const role of roles) {
    await httpDelete(http, getResourceUrl(API_ENDPOINT_ROLES, role));
    await httpDeleteWithIgnores(http, getResourceUrl(API_ENDPOINT_ROLESMAPPING, role), [404]);
  }
}

// TODO: have a type definition for it
export function fetchRole(http: HttpStart): Promise<any> {
  return httpGet<any>(http, API_ENDPOINT_ROLES);
}

// TODO: have a type definition for it
export function fetchRoleMapping(http: HttpStart): Promise<any> {
  return httpGet<any>(http, API_ENDPOINT_ROLESMAPPING);
}
