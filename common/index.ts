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

export const PLUGIN_ID = 'opendistroSecurity';
export const PLUGIN_NAME = 'opendistro_security';

export const API_PREFIX = '/api/v1';
export const CONFIGURATION_API_PREFIX = 'configuration';
export const API_ENDPOINT_AUTHINFO = API_PREFIX + '/auth/authinfo';
export const LOGIN_PAGE_URI = '/app/login';
export const SELECT_TENANT_PAGE_URI = '/app/select_tenant';
export const API_AUTH_LOGIN = '/auth/login';
export const API_AUTH_LOGOUT = '/auth/logout';

export enum AuthType {
  BASIC = 'basicauth',
  OPEN_ID = 'openid',
  JWT = 'jwt',
  SAML = 'saml',
  PROXY = 'proxy',
}

/**
 * A valid resource name should contain only letters (can be unicode chars), numbers, dash and underscore.
 * Here we don't limit length (except empty) or block brackets to be more compatible with previous version.
 * Dot (.), slash (/) and percent sign (%) are prohibited as they raise url injection issue.
 * @param resourceName resource name to be validated
 */
export function isValidResourceName(resourceName: string): boolean {
  // see: https://javascript.info/regexp-unicode
  return /^[\p{L}\p{N}\p{Pc}\p{Pd}\p{Ps}\p{Pe}]+$/u.test(resourceName);
}
