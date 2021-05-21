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

import { isEmpty, findKey, cloneDeep } from 'lodash';
import { OpenSearchDashboardsRequest } from '../../../../src/core/server';
import { SecuritySessionCookie } from '../session/security_cookie';
import { SecurityPluginConfigType } from '..';

const PRIVATE_TENANT_SYMBOL: string = '__user__';
const GLOBAL_TENANT_SYMBOL: string = '';

export const PRIVATE_TENANTS: string[] = [PRIVATE_TENANT_SYMBOL, 'private'];
export const GLOBAL_TENANTS: string[] = ['global', GLOBAL_TENANT_SYMBOL];
/**
 * Resovles the tenant the user is using.
 *
 * @param request OpenSearchDashboards request.
 * @param config security plugin config.
 * @param cookie cookie extracted from the request. The cookie should have been parsed by AuthenticationHandler.
 * pass it as parameter instead of extracting again.
 * @param authInfo authentication info, the Elasticsearch authinfo API response.
 *
 * @returns user preferred tenant of the request.
 */
export function resolveTenant(
  request: OpenSearchDashboardsRequest,
  username: string,
  availabeTenants: any,
  config: SecurityPluginConfigType,
  cookie: SecuritySessionCookie
): string | undefined {
  let selectedTenant: string | undefined;
  const query: any = request.url.query as any;
  if (query && (query.security_tenant || query.securitytenant)) {
    selectedTenant = query.security_tenant ? query.security_tenant : query.securitytenant;
  } else if (request.headers.securitytenant || request.headers.security_tenant) {
    selectedTenant = request.headers.securitytenant
      ? (request.headers.securitytenant as string)
      : (request.headers.security_tenant as string);
  } else if (isValidTenant(cookie.tenant)) {
    selectedTenant = cookie.tenant;
  } else {
    selectedTenant = undefined;
  }

  const preferredTenants = config.multitenancy?.tenants.preferred;
  const globalTenantEnabled = config.multitenancy?.tenants.enable_global || false;
  const privateTenantEnabled = config.multitenancy?.tenants.enable_private || false;

  return resolve(
    username,
    selectedTenant,
    preferredTenants,
    availabeTenants,
    globalTenantEnabled,
    privateTenantEnabled
  );
}

/**
 * Determines whether the request requires tenant info.
 * @param request opensearch-dashboards request.
 *
 * @returns true if the request requires tenant info, otherwise false.
 */
export function isMultitenantPath(request: OpenSearchDashboardsRequest): boolean {
  return (
    request.url.pathname?.startsWith('/opensearch') ||
    request.url.pathname?.startsWith('/api') ||
    request.url.pathname?.startsWith('/app') ||
    // short url path
    request.url.pathname?.startsWith('/goto') ||
    // bootstrap.js depends on tenant info to fetch opensearch-dashboards configs in tenant index
    (request.url.pathname?.indexOf('bootstrap.js') || -1) > -1 ||
    request.url.pathname === '/'
  );
}

function resolve(
  username: string,
  requestedTenant: string | undefined,
  preferredTenants: string[] | undefined,
  availableTenants: any, // is an object like { tenant_name_1: true, tenant_name_2: false, ... }
  globalTenantEnabled: boolean,
  privateTenantEnabled: boolean
): string | undefined {
  const availableTenantsClone = cloneDeep(availableTenants);
  delete availableTenantsClone[username];

  if (!globalTenantEnabled && !privateTenantEnabled && isEmpty(availableTenantsClone)) {
    return undefined;
  }

  if (isValidTenant(requestedTenant)) {
    requestedTenant = requestedTenant!;
    if (requestedTenant in availableTenants) {
      return requestedTenant;
    }

    if (
      privateTenantEnabled &&
      username in availableTenants &&
      PRIVATE_TENANTS.indexOf(requestedTenant) > -1
    ) {
      return PRIVATE_TENANT_SYMBOL;
    }

    if (globalTenantEnabled && GLOBAL_TENANTS.indexOf(requestedTenant) > -1) {
      return GLOBAL_TENANT_SYMBOL;
    }
  }

  if (preferredTenants && !isEmpty(preferredTenants)) {
    for (const element of preferredTenants) {
      const tenant = element.toLowerCase();

      if (globalTenantEnabled && GLOBAL_TENANTS.indexOf(tenant) > -1) {
        return GLOBAL_TENANT_SYMBOL;
      }

      if (
        privateTenantEnabled &&
        PRIVATE_TENANTS.indexOf(tenant) > -1 &&
        username in availableTenants
      ) {
        return PRIVATE_TENANT_SYMBOL;
      }

      if (tenant in availableTenants) {
        return tenant;
      }
    }
  }

  if (globalTenantEnabled) {
    return GLOBAL_TENANT_SYMBOL;
  }

  if (privateTenantEnabled) {
    return PRIVATE_TENANT_SYMBOL;
  }

  // fall back to the first tenant in the available tenants
  return findKey(availableTenantsClone, () => true);
}

/**
 * Return true if tenant parameter is a valid tenent.
 *
 * Note: empty string '' is valid, which means global tenant.
 *
 * @param tenant
 */
export function isValidTenant(tenant: string | undefined | null): boolean {
  return tenant !== undefined && tenant !== null;
}
