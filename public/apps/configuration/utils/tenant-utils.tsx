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

import { HttpStart } from 'kibana/public';
import { map } from 'lodash';
import {
  API_ENDPOINT_TENANTS,
  API_ENDPOINT_MULTITENANCY,
  RoleViewTenantInvalidText,
} from '../constants';
import {
  DataObject,
  ObjectsMessage,
  Tenant,
  TenantUpdate,
  TenantSelect,
  RoleTenantPermissionView,
  RoleTenantPermissionDetail,
  TenantPermissionType,
  RoleTenantPermission,
} from '../types';
import { TENANT_READ_PERMISSION, TENANT_WRITE_PERMISSION } from '../constants';

export const globalTenantName = 'global_tenant';
export const GLOBAL_USER_DICT: { [key: string]: string } = {
  Label: 'Global',
  Value: '',
  Description: 'Everyone can see it',
};

export const PRIVATE_USER_DICT: { [key: string]: string } = {
  Label: 'Private',
  Value: '__user__',
  Description: 'Only visible to the current logged in user',
};

export async function fetchTenants(http: HttpStart): Promise<DataObject<Tenant>> {
  return ((await http.get(API_ENDPOINT_TENANTS)) as ObjectsMessage<Tenant>).data;
}

export async function fetchTenantNameList(http: HttpStart): Promise<string[]> {
  return Object.keys(await fetchTenants(http));
}

export function transformTenantData(
  rawTenantData: DataObject<Tenant>,
  isPrivateEnabled: boolean
): Tenant[] {
  // @ts-ignore
  const tenantList: Tenant[] = map<Tenant, Tenant>(rawTenantData, (v: Tenant, k?: string) => ({
    tenant: k === globalTenantName ? GLOBAL_USER_DICT.Label : k || '',
    reserved: v.reserved,
    description: k === globalTenantName ? GLOBAL_USER_DICT.Description : v.description,
    tenantValue: k === globalTenantName ? GLOBAL_USER_DICT.Value : k || '',
  }));
  if (isPrivateEnabled) {
    // Insert Private Tenant in List
    tenantList.splice(1, 0, {
      tenant: PRIVATE_USER_DICT.Label,
      reserved: true,
      description: PRIVATE_USER_DICT.Description,
      tenantValue: PRIVATE_USER_DICT.Value,
    });
  }
  return tenantList;
}

export async function fetchCurrentTenant(http: HttpStart) {
  return await http.get(API_ENDPOINT_MULTITENANCY);
}

export async function updateTenant(
  http: HttpStart,
  tenantName: string,
  updateObject: TenantUpdate
) {
  return await http.post(`${API_ENDPOINT_TENANTS}/${tenantName}`, {
    body: JSON.stringify(updateObject),
  });
}

export async function requestDeleteTenant(http: HttpStart, tenants: string[]) {
  for (const tenant of tenants) {
    await http.delete(`${API_ENDPOINT_TENANTS}/${tenant}`);
  }
}

export async function selectTenant(http: HttpStart, selectObject: TenantSelect) {
  return await http.post(`${API_ENDPOINT_MULTITENANCY}`, {
    body: JSON.stringify(selectObject),
  });
}

export const RESOLVED_GLOBAL_TENANT = 'Global';
export const RESOLVED_PRIVATE_TENANT = 'Private';

export function resolveTenantName(tenant: string, userName: string) {
  if (!tenant || tenant === 'undefined') {
    return RESOLVED_GLOBAL_TENANT;
  }
  if (tenant === userName || tenant === '__user__') {
    return RESOLVED_PRIVATE_TENANT;
  } else {
    return tenant;
  }
}

export function formatTenantName(tenantName: string): string {
  if (tenantName === globalTenantName) return GLOBAL_USER_DICT.Label;
  return tenantName;
}

export function transformRoleTenantPermissionData(
  tenantPermissions: RoleTenantPermissionView[],
  tenantList: Tenant[]
): RoleTenantPermissionDetail[] {
  return map(tenantPermissions, (tenantPermission: RoleTenantPermissionView) => {
    const tenantNames: string[] = tenantList.map((t: Tenant) => t.tenant);
    /**
     * Here we only consider the case that containing one tenant and
     * for other case (multiple tenants, tenant pattern) we return N/A.
     */
    let tenantItem = null;
    if (
      tenantPermission.tenant_patterns.length === 1 &&
      tenantNames.includes(formatTenantName(tenantPermission.tenant_patterns[0]))
    ) {
      tenantItem = tenantList.filter((t) => {
        return t.tenant === formatTenantName(tenantPermission.tenant_patterns[0]);
      })[0];
    }
    return {
      tenant_patterns: tenantPermission.tenant_patterns,
      permissionType: tenantPermission.permissionType,
      tenant: tenantItem?.tenant || RoleViewTenantInvalidText,
      reserved: tenantItem?.reserved || false,
      description: tenantItem?.description || RoleViewTenantInvalidText,
      tenantValue: tenantItem ? tenantItem.tenantValue : RoleViewTenantInvalidText,
    };
  });
}

export function getTenantPermissionType(tenantPermissions: string[]) {
  const readable = tenantPermissions.includes(TENANT_READ_PERMISSION);
  const writable = tenantPermissions.includes(TENANT_WRITE_PERMISSION);
  let permissionType = TenantPermissionType.None;
  if (writable) {
    permissionType = TenantPermissionType.ReadWrite;
  } else if (readable) {
    permissionType = TenantPermissionType.Read;
  }
  return permissionType;
}

export function transformRoleTenantPermissions(
  roleTenantPermission: RoleTenantPermission[]
): RoleTenantPermissionView[] {
  return roleTenantPermission.map((tenantPermission) => ({
    tenant_patterns: tenantPermission.tenant_patterns,
    permissionType: getTenantPermissionType(tenantPermission.allowed_actions),
  }));
}
