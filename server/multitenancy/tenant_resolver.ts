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
import { SecuritySessionCookie } from '../session/security_cookie';
import { GLOBAL_TENANT_SYMBOL, PRIVATE_TENANT_SYMBOL, globalTenantName } from '../../common';
import { modifyUrl } from '../../../../packages/osd-std';
import { ensureRawRequest } from '../../../../src/core/server/http/router';
import { GOTO_PREFIX } from '../../../../src/plugins/share/common/short_url_routes';
import { SecurityPluginConfigType } from '..';

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
  // eslint-disable-next-line @typescript-eslint/naming-convention
  const security_tenant = request?.url?.searchParams?.get('security_tenant');
  if (query && (query.security_tenant || query.securitytenant)) {
    selectedTenant = query.security_tenant ? query.security_tenant : query.securitytenant;
  } else if (security_tenant) {
    selectedTenant = security_tenant;
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
