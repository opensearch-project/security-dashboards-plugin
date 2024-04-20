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

/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 *****************************
 SECURITY DASHBOARDS PLUGIN CONSTANTS
 *****************************
 */

export const ALL_ACCESS_ROLE = 'all_access';

//Admin Credential
export const ADMIN_AUTH = {
  username: Cypress.env('adminUserName'),
  password: Cypress.env('adminPassword'),
};

const basePath = Cypress.env('basePath') || '';

//Security API Constants
export const SEC_API_PREFIX = '/_plugins/_security/api';
export const SEC_API = {
  TENANTS_BASE: `${SEC_API_PREFIX}/tenants`,
  INTERNALUSERS_BASE: `${SEC_API_PREFIX}/internalusers`,
  ROLE_BASE: `${SEC_API_PREFIX}/roles`,
  ROLE_MAPPING_BASE: `${SEC_API_PREFIX}/rolesmapping`,
};
export const DASHBOARDS_API = {
  SHORTEN_URL: `${basePath}/api/shorten_url`,
};
export const SHORTEN_URL_DATA = { url: `/app/home#/tutorial_directory` };
