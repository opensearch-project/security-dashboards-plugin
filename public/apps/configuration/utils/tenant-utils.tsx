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

import { HttpStart } from 'opensearch-dashboards/public';
import { map } from 'lodash';
import React from 'react';
import { i18n } from '@osd/i18n';
import {
  API_ENDPOINT_MULTITENANCY,
  API_ENDPOINT_TENANCY_CONFIGS,
  API_ENDPOINT_TENANTS,
  RoleViewTenantInvalidText,
  TENANT_READ_PERMISSION,
  TENANT_WRITE_PERMISSION,
} from '../constants';
import {
  DataObject,
  ObjectsMessage,
  RoleTenantPermission,
  RoleTenantPermissionDetail,
  RoleTenantPermissionView,
  Tenant,
  TenantPermissionType,
  TenantSelect,
  TenantUpdate,
} from '../types';
import { httpDelete, httpGet, httpPost, httpPut } from './request-utils';
import { getResourceUrl } from './resource-utils';
import {
  API_ENDPOINT_DASHBOARDSINFO,
  DEFAULT_TENANT,
  GLOBAL_TENANT_RENDERING_TEXT,
  GLOBAL_TENANT_SYMBOL,
  globalTenantName,
  isGlobalTenant,
  isRenderingPrivateTenant,
  PRIVATE_TENANT_RENDERING_TEXT,
  SAML_AUTH_LOGIN,
} from '../../../../common';
import { TenancyConfigSettings } from '../panels/tenancy-config/types';

export const GLOBAL_USER_DICT: { [key: string]: string } = {
  Label: 'Global',
  Value: GLOBAL_TENANT_SYMBOL,
  Description: 'Everyone can see it',
};

export const PRIVATE_USER_DICT: { [key: string]: string } = {
  Label: 'Private',
  Value: '__user__',
  Description: 'Only visible to the current logged in user',
};

export async function fetchTenants(http: HttpStart): Promise<DataObject<Tenant>> {
  return (await httpGet<ObjectsMessage<Tenant>>(http, API_ENDPOINT_TENANTS)).data;
}

export async function fetchTenantNameList(http: HttpStart): Promise<string[]> {
  return Object.keys(await fetchTenants(http));
}

export function transformTenantData(rawTenantData: DataObject<Tenant>): Tenant[] {
  // @ts-ignore
  const tenantList: Tenant[] = map<Tenant, Tenant>(rawTenantData, (v: Tenant, k?: string) => ({
    tenant: k === globalTenantName ? GLOBAL_USER_DICT.Label : k || GLOBAL_TENANT_SYMBOL,
    reserved: v.reserved,
    description: k === globalTenantName ? GLOBAL_USER_DICT.Description : v.description,
    tenantValue: k === globalTenantName ? GLOBAL_USER_DICT.Value : k || GLOBAL_TENANT_SYMBOL,
  }));
  tenantList.splice(1, 0, {
    tenant: PRIVATE_USER_DICT.Label,
    reserved: true,
    description: PRIVATE_USER_DICT.Description,
    tenantValue: PRIVATE_USER_DICT.Value,
  });
  return tenantList;
}

export async function fetchCurrentTenant(http: HttpStart): Promise<string> {
  return await httpGet<string>(http, API_ENDPOINT_MULTITENANCY);
}

export async function updateTenant(
  http: HttpStart,
  tenantName: string,
  updateObject: TenantUpdate
) {
  return await httpPost(http, getResourceUrl(API_ENDPOINT_TENANTS, tenantName), updateObject);
}

export async function updateTenancyConfiguration(
  http: HttpStart,
  updatedTenancyConfig: TenancyConfigSettings
) {
  await httpPut(http, API_ENDPOINT_TENANCY_CONFIGS, updatedTenancyConfig);

  return;
}

export async function requestDeleteTenant(http: HttpStart, tenants: string[]) {
  for (const tenant of tenants) {
    await httpDelete(http, getResourceUrl(API_ENDPOINT_TENANTS, tenant));
  }
}

export async function selectTenant(http: HttpStart, selectObject: TenantSelect): Promise<string> {
  return await httpPost<string>(http, API_ENDPOINT_MULTITENANCY, selectObject);
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

export function getNamespacesToRegister(accountInfo: any) {
  const tenants = accountInfo.tenants || {};
  const availableTenantNames = Object.keys(tenants!);
  const namespacesToRegister = availableTenantNames.map((tenant) => {
    if (tenant === globalTenantName) {
      return {
        id: GLOBAL_USER_DICT.Value,
        name: GLOBAL_USER_DICT.Label,
      };
    } else if (tenant === accountInfo.user_name) {
      return {
        id: `${PRIVATE_USER_DICT.Value}${accountInfo.user_name}`,
        name: PRIVATE_USER_DICT.Label,
      };
    }
    return {
      id: tenant,
      name: tenant,
    };
  });
  namespacesToRegister.push({
    id: DEFAULT_TENANT,
    name: DEFAULT_TENANT,
  });
  return namespacesToRegister;
}

export const tenantColumn = {
  id: 'tenant_column',
  euiColumn: {
    field: 'namespaces',
    name: <div>Tenant</div>,
    dataType: 'string',
    render: (value: any[][]) => {
      let text = value.flat()[0];
      if (isGlobalTenant(text)) {
        text = GLOBAL_TENANT_RENDERING_TEXT;
      } else if (isRenderingPrivateTenant(text)) {
        text = PRIVATE_TENANT_RENDERING_TEXT;
      }
      text = i18n.translate('savedObjectsManagement.objectsTable.table.columnTenantName', {
        defaultMessage: text,
      });
      return <div>{text}</div>;
    },
  },
  loadData: () => {},
};
