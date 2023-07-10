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

import { isEmpty, findKey, cloneDeep } from 'lodash';
import { OpenSearchDashboardsRequest } from 'opensearch-dashboards/server';
import { ResponseObject } from '@hapi/hapi';
import { modifyUrl } from '@osd/std';
import { SecuritySessionCookie } from '../session/security_cookie';
import { SecurityPluginConfigType } from '..';
import { GLOBAL_TENANT_SYMBOL, PRIVATE_TENANT_SYMBOL, globalTenantName } from '../../common';
import { ensureRawRequest } from '../../../../src/core/server/http/router';
import { GOTO_PREFIX } from '../../../../src/plugins/share/common/short_url_routes';

export const PRIVATE_TENANTS: string[] = [PRIVATE_TENANT_SYMBOL, 'private'];
export const GLOBAL_TENANTS: string[] = ['global', GLOBAL_TENANT_SYMBOL, 'Global'];
/**
 * Resovles the tenant the user is using.
 *
 * @param request OpenSearchDashboards request.
 * @param username
 * @param roles
 * @param availabeTenants
 * @param config security plugin config.
 * @param cookie cookie extracted from the request. The cookie should have been parsed by AuthenticationHandler.
 * pass it as parameter instead of extracting again.
 * @param multitenancyEnabled
 * @param privateTenantEnabled
 * @param defaultTenant
 *
 * @returns user preferred tenant of the request.
 */
export function resolveTenant({
  request,
  username,
  roles,
  availabeTenants,
  config,
  cookie,
  multitenancyEnabled,
  privateTenantEnabled,
  defaultTenant,
}: {
  request: any;
  username: string;
  roles: string[] | undefined;
  availabeTenants: any;
  config: SecurityPluginConfigType;
  cookie: SecuritySessionCookie;
  multitenancyEnabled: boolean;
  privateTenantEnabled: boolean | undefined;
  defaultTenant: string | undefined;
}): string | undefined {
  const DEFAULT_READONLY_ROLES = ['kibana_read_only'];
  let selectedTenant: string | undefined;
  const securityTenant_ = request?.url?.searchParams?.get('securityTenant_');
  const securitytenant = request?.url?.searchParams?.get('securitytenant');
  // eslint-disable-next-line @typescript-eslint/naming-convention
  const security_tenant = request?.url?.searchParams?.get('security_tenant');
  if (securityTenant_) {
    selectedTenant = securityTenant_;
  } else if (securitytenant) {
    selectedTenant = securitytenant;
  } else if (security_tenant) {
    selectedTenant = security_tenant;
  } else if (request.headers.securitytenant || request.headers.securityTenant_) {
    selectedTenant = request.headers.securitytenant
      ? (request.headers.securitytenant as string)
      : (request.headers.securityTenant_ as string);
  } else if (isValidTenant(cookie.tenant)) {
    selectedTenant = cookie.tenant;
  } else if (defaultTenant && multitenancyEnabled) {
    selectedTenant = defaultTenant;
  } else {
    selectedTenant = undefined;
  }
  const isReadonly = roles?.some(
    (role) => config.readonly_mode?.roles.includes(role) || DEFAULT_READONLY_ROLES.includes(role)
  );

  const preferredTenants = config.multitenancy?.tenants.preferred;
  const globalTenantEnabled = config.multitenancy?.tenants.enable_global;

  return resolve(
    username,
    selectedTenant,
    preferredTenants,
    availabeTenants,
    globalTenantEnabled,
    multitenancyEnabled,
    privateTenantEnabled
  );
}

export function resolve(
  username: string,
  requestedTenant: string | undefined,
  preferredTenants: string[] | undefined,
  availableTenants: any, // is an object like { tenant_name_1: true, tenant_name_2: false, ... }
  globalTenantEnabled: boolean,
  multitenancyEnabled: boolean | undefined,
  privateTenantEnabled: boolean | undefined
): string | undefined {
  const availableTenantsClone = cloneDeep(availableTenants);
  delete availableTenantsClone[username];

  if (!globalTenantEnabled && !privateTenantEnabled && isEmpty(availableTenantsClone)) {
    return undefined;
  }

  if (!multitenancyEnabled) {
    if (!globalTenantEnabled) {
      return undefined;
    }
    return GLOBAL_TENANT_SYMBOL;
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

  /**
   * Fall back to the first tenant in the available tenants
   * Under the condition of enabling multitenancy, if the user has disabled both 'Global' and 'Private' tenants:
   * it will remove the default global tenant key for custom tenant.
   */
  if (
    Object.keys(availableTenantsClone).length > 1 &&
    availableTenantsClone.hasOwnProperty(globalTenantName)
  ) {
    delete availableTenantsClone[globalTenantName];
  }
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

/**
 * If multitenancy is enabled & the URL entered starts with /goto,
 * We will modify the rawResponse to add a new parameter to the URL, the security_tenant (or value for tenant when in multitenancy)
 * With the security_tenant added, the resolved short URL now contains the security_tenant information (so the short URL retains the tenant information).
 **/

export function addTenantParameterToResolvedShortLink(request: OpenSearchDashboardsRequest) {
  if (request.url.pathname.startsWith(`${GOTO_PREFIX}/`)) {
    const rawRequest = ensureRawRequest(request);
    const rawResponse = rawRequest.response as ResponseObject;

    // Make sure the request really should redirect
    if (rawResponse.headers.location) {
      const modifiedUrl = modifyUrl(rawResponse.headers.location as string, (parts) => {
        if (parts.query.security_tenant === undefined) {
          parts.query.security_tenant = request.headers.securitytenant as string;
        }
        // Mutating the headers toolkit.next({headers: ...}) logs a warning about headers being overwritten
      });
      rawResponse.headers.location = modifiedUrl;
    }
  }

  return request;
}
