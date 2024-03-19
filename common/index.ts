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

export const PLUGIN_ID = 'opensearchDashboardsSecurity';
export const PLUGIN_NAME = 'security-dashboards-plugin';

export const APP_ID_LOGIN = 'login';
export const APP_ID_CUSTOMERROR = 'customerror';

export const API_PREFIX = '/api/v1';
export const CONFIGURATION_API_PREFIX = 'configuration';
export const API_ENDPOINT_AUTHINFO = API_PREFIX + '/auth/authinfo';
export const LOGIN_PAGE_URI = '/app/' + APP_ID_LOGIN;
export const CUSTOM_ERROR_PAGE_URI = '/app/' + APP_ID_CUSTOMERROR;
export const API_AUTH_LOGIN = '/auth/login';
export const API_AUTH_LOGOUT = '/auth/logout';

export const ERROR_MISSING_ROLE_PATH = '/missing-role';

export const MAX_INTEGER = 2147483647;

export const GLOBAL_TENANT_SYMBOL = '';
export const PRIVATE_TENANT_SYMBOL = '__user__';
export const DEFAULT_TENANT = 'default';
export const GLOBAL_TENANT_RENDERING_TEXT = 'Global';
export const PRIVATE_TENANT_RENDERING_TEXT = 'Private';
export const globalTenantName = 'global_tenant';
export const MAX_LENGTH_OF_COOKIE_BYTES = 4000;
export const ESTIMATED_IRON_COOKIE_OVERHEAD = 1.5;
export enum AuthType {
  BASIC = 'basicauth',
  OPEN_ID = 'openid',
  JWT = 'jwt',
  SAML = 'saml',
  PROXY = 'proxy',
}

/**
 * A valid resource name should not containing percent sign (%) as they raise url injection issue.
 * And also should not be empty.
 * @param resourceName resource name to be validated
 */
export function isValidResourceName(resourceName: string): boolean {
  // see: https://javascript.info/regexp-unicode
  return !/[\p{C}%]/u.test(resourceName) && resourceName.length > 0;
}

export function isGlobalTenant(selectedTenant: string | null) {
  return selectedTenant !== null && selectedTenant === GLOBAL_TENANT_SYMBOL;
}
