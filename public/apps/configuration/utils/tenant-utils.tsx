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
import { API_ENDPOINT_TENANTS, API_ENDPOINT_MULTITENANCY } from '../constants';
import { DataObject, ObjectsMessage, Tenant, TenantUpdate, TenantSelect } from '../types';

const globalTenantName = 'global_tenant';
const GLOBAL_USER_DICT: { [key: string]: string } = {
  Label: 'Global',
  Value: '',
  Description: 'Everyone can see it',
};

const PRIVATE_USER_DICT: { [key: string]: string } = {
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

export function transformTenantData(rawTenantData: DataObject<Tenant>, isPrivateEnabled: boolean) {
  const tenantList = map(rawTenantData, (v: any, k: string) => ({
    tenant: k === globalTenantName ? GLOBAL_USER_DICT.Label : k,
    reserved: v.reserved,
    description: k === globalTenantName ? GLOBAL_USER_DICT.Description : v.description,
    tenantValue: k === globalTenantName ? GLOBAL_USER_DICT.Value : k,
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

export function resolveTenantName(tenant: string, userName: string) {
  if (!tenant || tenant === 'undefined') {
    return 'Global';
  }
  if (tenant === userName || tenant === '__user__') {
    return 'Private';
  } else {
    return tenant;
  }
}
