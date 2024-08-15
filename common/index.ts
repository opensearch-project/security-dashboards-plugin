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
export const PLUGIN_GET_STARTED_APP_ID = `${PLUGIN_NAME}_getstarted`;
export const PLUGIN_AUTH_APP_ID = `${PLUGIN_NAME}_auth`;
export const PLUGIN_ROLES_APP_ID = `${PLUGIN_NAME}_roles`;
export const PLUGIN_USERS_APP_ID = `${PLUGIN_NAME}_users`;
export const PLUGIN_PERMISSIONS_APP_ID = `${PLUGIN_NAME}_permissions`;
export const PLUGIN_TENANTS_APP_ID = `${PLUGIN_NAME}_tenants`;
export const PLUGIN_AUDITLOG_APP_ID = `${PLUGIN_NAME}_auditlog`;

export const APP_ID_LOGIN = 'login';
export const APP_ID_CUSTOMERROR = 'customerror';
export const OPENDISTRO_SECURITY_ANONYMOUS = 'opendistro_security_anonymous';

export const API_PREFIX = '/api/v1';
export const CONFIGURATION_API_PREFIX = 'configuration';
export const API_ENDPOINT_AUTHINFO = API_PREFIX + '/auth/authinfo';
export const API_ENDPOINT_DASHBOARDSINFO = API_PREFIX + '/auth/dashboardsinfo';
export const API_ENDPOINT_AUTHTYPE = API_PREFIX + '/auth/type';
export const LOGIN_PAGE_URI = '/app/' + APP_ID_LOGIN;
export const CUSTOM_ERROR_PAGE_URI = '/app/' + APP_ID_CUSTOMERROR;
export const API_AUTH_LOGIN = '/auth/login';
export const API_AUTH_LOGOUT = '/auth/logout';
export const OPENID_AUTH_LOGIN = '/auth/openid/login';
export const OPENID_AUTH_LOGIN_WITH_FRAGMENT = '/auth/openid/captureUrlFragment';
export const SAML_AUTH_LOGIN = '/auth/saml/login';
export const SAML_AUTH_LOGIN_WITH_FRAGMENT = '/auth/saml/captureUrlFragment';
export const ANONYMOUS_AUTH_LOGIN = '/auth/anonymous';
export const AUTH_TYPE_PARAM = 'auth_type';

export const OPENID_AUTH_LOGOUT = '/auth/openid/logout';
export const SAML_AUTH_LOGOUT = '/auth/saml/logout';
export const ANONYMOUS_AUTH_LOGOUT = '/auth/anonymous/logout';

export const ERROR_MISSING_ROLE_PATH = '/missing-role';
export const AUTH_HEADER_NAME = 'authorization';
export const AUTH_GRANT_TYPE = 'authorization_code';
export const AUTH_RESPONSE_TYPE = 'code';

export const GLOBAL_TENANT_SYMBOL = '';
export const PRIVATE_TENANT_SYMBOL = '__user__';
export const DEFAULT_TENANT = 'default';
export const GLOBAL_TENANT_RENDERING_TEXT = 'Global';
export const PRIVATE_TENANT_RENDERING_TEXT = 'Private';
export const globalTenantName = 'global_tenant';

export const MAX_INTEGER = 2147483647;
export const MAX_LENGTH_OF_COOKIE_BYTES = 4000;
export const ESTIMATED_IRON_COOKIE_OVERHEAD = 1.5;

export const LOCAL_CLUSTER_ID = '';

export enum AuthType {
  BASIC = 'basicauth',
  OPEN_ID = 'openid',
  JWT = 'jwt',
  SAML = 'saml',
  PROXY = 'proxy',
  ANONYMOUS = 'anonymous',
}

export enum ResourceType {
  roles = 'roles',
  users = 'users',
  permissions = 'permissions',
  tenants = 'tenants',
  tenantsManageTab = 'tenantsManageTab',
  tenantsConfigureTab = 'tenantsConfigureTab',
  auth = 'auth',
  auditLogging = 'auditLogging',
  authFailureListeners = 'authFailureListeners',
}

/**
 * A valid resource name should not containing percent sign (%) as they raise url injection issue.
 * And also should not be empty.
 * @param resourceName resource name to be validated
 */
export function isValidResourceName(resourceName: string): boolean {
  // see: https://javascript.info/regexp-unicode
  const exp = new RegExp('[\\p{C}%]', 'u');
  return !exp.test(resourceName) && resourceName.length > 0;
}

export function isPrivateTenant(selectedTenant: string | null) {
  return selectedTenant !== null && selectedTenant === PRIVATE_TENANT_SYMBOL;
}

export function isRenderingPrivateTenant(selectedTenant: string | null) {
  return selectedTenant !== null && selectedTenant?.startsWith(PRIVATE_TENANT_SYMBOL);
}

export function isGlobalTenant(selectedTenant: string | null) {
  return selectedTenant !== null && selectedTenant === GLOBAL_TENANT_SYMBOL;
}
