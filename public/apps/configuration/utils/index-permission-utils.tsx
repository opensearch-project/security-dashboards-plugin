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
import { FieldLevelSecurityMethod, TenantPermissionType } from '../panels/role-edit/types';
import {
  RoleIndexPermission,
  RoleIndexPermissionView,
  RoleTenantPermission,
  RoleTenantPermissionView,
} from '../types';
import { TENANT_READ_PERMISSION, TENANT_WRITE_PERMISSION } from '../constants';

/**
 * Identify the method is whether exclude or include.
 * @param fieldLevelSecurityRawFields fields fetched from backend
 * ["~field1", "~field2"] => exclude
 * ["field1", "field2"] => include
 */
export function getFieldLevelSecurityMethod(
  fieldLevelSecurityRawFields: string[]
): FieldLevelSecurityMethod {
  // Leading ~ indicates exclude.
  return fieldLevelSecurityRawFields.some((s: string) => s.startsWith('~')) ? 'exclude' : 'include';
}

export function transformRoleIndexPermissions(
  roleIndexPermission: RoleIndexPermission[]
): RoleIndexPermissionView[] {
  return map(roleIndexPermission, (indexPermission: RoleIndexPermission, arrayIndex: number) => ({
    id: arrayIndex,
    index_patterns: indexPermission.index_patterns,
    dls: indexPermission.dls,
    fls: indexPermission.fls,
    masked_fields: indexPermission.masked_fields,
    allowed_actions: indexPermission.allowed_actions,
  }));
}

const PermissionTypeDisplay = {
  rw: 'Read and Write',
  r: 'Read only',
  w: 'Write only',
  '': '',
};

export function transformRoleTenantPermissions(
  roleTenantPermission: RoleTenantPermission[]
): RoleTenantPermissionView[] {
  return roleTenantPermission.map((tenantPermission) => {
    const readable = tenantPermission.allowed_actions.includes(TENANT_READ_PERMISSION);
    const writable = tenantPermission.allowed_actions.includes(TENANT_WRITE_PERMISSION);
    let permissionType = TenantPermissionType.None;
    if (readable && writable) {
      permissionType = TenantPermissionType.Full;
    } else if (readable) {
      permissionType = TenantPermissionType.Read;
    } else if (writable) {
      permissionType = TenantPermissionType.Write;
    }
    return {
      tenant_patterns: tenantPermission.tenant_patterns,
      permissionType: PermissionTypeDisplay[permissionType],
    };
  });
}
