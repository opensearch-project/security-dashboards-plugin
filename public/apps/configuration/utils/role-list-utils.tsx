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
import { API_ENDPOINT_ROLES } from '../constants';

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

Output schema: [{
  role_name: ""
  reserved: bool,
  cluster_permissions: [""],
  index_permissions: [""],
  tenant_permissions: [""],
  internal_users: [""],
  backend_roles: [""]
}]
*/
export function transformRoleData(rawRoleData: any, rawRoleMappingData: any) {
  return map(rawRoleData.data, (v: any, k: string) => ({
    role_name: k,
    reserved: v.reserved,
    cluster_permissions: v.cluster_permissions,
    index_permissions: chain(v.index_permissions).map('index_patterns').flatten().compact().value(),
    tenant_permissions: chain(v.index_permissions)
      .map('tenant_patterns')
      .flatten()
      .compact()
      .value(),
    internal_users: rawRoleMappingData.data[k]?.users || [],
    backend_roles: rawRoleMappingData.data[k]?.backend_roles || [],
  }));
}

// Flatten list, remove duplicate and null, sort
export function buildSearchFilterOptions(roleList: any[], attrName: string) {
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
    await http.delete(`${API_ENDPOINT_ROLES}/${role}`);
  }
}
