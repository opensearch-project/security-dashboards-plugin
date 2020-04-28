
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

import _ from 'lodash';

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
  return _.pairs(_.merge(rawRoleData.data, rawRoleMappingData.data)).map(r => ({
    role_name: r[0],
    reserved: r[1].reserved,
    cluster_permissions: r[1].cluster_permissions,
    index_permissions: _.chain(r[1].index_permissions)
      .map('index_patterns')
      .flatten()
      .compact()
      .value(),
    tenant_permissions: _.chain(r[1].index_permissions)
      .map('tenant_patterns')
      .flatten()
      .compact()
      .value(),
    internal_users: r[1].users,
    backend_roles: r[1].backend_roles,
  }));
}
