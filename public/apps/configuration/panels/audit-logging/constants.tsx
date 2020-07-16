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

export const CONFIG_LABELS = {
  AUDIT_LOGGING: 'Audit logging',
  GENERAL_SETTINGS: 'General settings',
  LAYER_SETTINGS: 'Layer settings',
  ATTRIBUTE_SETTINGS: 'Attribute settings',
  IGNORE_SETTINGS: 'Ignore settings',
  COMPLIANCE_SETTINGS: 'Compliance settings',
  COMPLIANCE_CONFIG_SETTINGS: 'Config settings',
  COMPLIANCE_READ: 'Read',
  COMPLIANCE_WRITE: 'Write',
};

export const RESPONSE_MESSAGES = {
  FETCH_ERROR_TITLE: 'Sorry, there was an error fetching audit configuration.',
  FETCH_ERROR_MESSAGE:
    'Please ensure hot reloading of audit configuration is enabled in the security plugin.',
  UPDATE_SUCCESS: 'Audit configuration was successfully updated.',
  UPDATE_FAILURE: 'Audit configuration could not be updated. Please check configuration.',
};

export interface SettingContent {
  title: string;
  key: string;
  path: string;
  description: string;
  type: string;
  options?: string[];
}

const REST_LAYER: SettingContent = {
  title: 'REST layer',
  key: 'config:audit:enable_rest',
  path: 'audit.enable_rest',
  description: 'Enable or disable auditing events that happen on the REST layer',
  type: 'bool',
};

const REST_DISABLED_CATEGORIES: SettingContent = {
  title: 'REST disabled categories',
  key: 'config:audit:disabled_rest_categories',
  path: 'audit.disabled_rest_categories',
  description: 'Specify audit categories which must be ignored on the REST layer',
  type: 'array',
  options: [
    'BAD_HEADERS',
    'FAILED_LOGIN',
    'MISSING_PRIVILEGES',
    'GRANTED_PRIVILEGES',
    'SSL_EXCEPTION',
    'AUTHENTICATED',
  ],
};

const TRANSPORT_LAYER: SettingContent = {
  title: 'Transport layer',
  key: 'config:audit:enable_transport',
  path: 'audit.enable_transport',
  description: 'Enable or disable auditing events that happen on the Transport layer',
  type: 'bool',
};

const TRANSPORT_DISABLED_CATEGORIES: SettingContent = {
  title: 'Transport disabled categories',
  key: 'config:audit:disabled_transport_categories',
  path: 'audit.disabled_transport_categories',
  description: 'Specify audit categories which must be ignored on the Transport layer',
  type: 'array',
  options: [
    'BAD_HEADERS',
    'FAILED_LOGIN',
    'MISSING_PRIVILEGES',
    'GRANTED_PRIVILEGES',
    'SSL_EXCEPTION',
    'AUTHENTICATED',
  ],
};

const BULK_REQUESTS: SettingContent = {
  title: 'Bulk requests',
  key: 'config:audit:resolve_bulk_requests',
  path: 'audit.resolve_bulk_requests',
  description: 'Resolve bulk requests during auditing of requests.',
  type: 'bool',
};

const REQUEST_BODY: SettingContent = {
  title: 'Request body',
  key: 'config:audit:log_request_body',
  path: 'audit.log_request_body',
  description: 'Include request body during auditing of requests.',
  type: 'bool',
};

const RESOLVE_INDICES: SettingContent = {
  title: 'Resolve indices',
  key: 'config:audit:resolve_indices',
  path: 'audit.resolve_indices',
  description: 'Resolve indices during auditing of requests.',
  type: 'bool',
};

const SENSITIVE_HEADERS: SettingContent = {
  title: 'Sensitive headers',
  key: 'config:audit:exclude_sensitive_headers',
  path: 'audit.exclude_sensitive_headers',
  description: 'Exclude sensitive headers during auditing. Eg: Authorization header',
  type: 'bool',
};

const IGNORED_USERS: SettingContent = {
  title: 'Ignored users',
  key: 'config:audit:ignore_users',
  path: 'audit.ignore_users',
  description: 'Users to ignore during auditing.',
  type: 'array',
};

const IGNORED_REQUESTS: SettingContent = {
  title: 'Ignored requests',
  key: 'config:audit:ignore_requests',
  path: 'audit.ignore_requests',
  description: 'Request patterns to ignore during auditing.',
  type: 'array',
};

const CONFIG = {
  ENABLED: {
    title: 'Enable audit logging',
    key: 'config:enabled',
    path: 'enabled',
    description: 'Enable or disable audit logging',
    type: 'bool',
  },
  AUDIT: {
    REST_LAYER,
    REST_DISABLED_CATEGORIES,
    TRANSPORT_LAYER,
    TRANSPORT_DISABLED_CATEGORIES,
    BULK_REQUESTS,
    REQUEST_BODY,
    RESOLVE_INDICES,
    SENSITIVE_HEADERS,
    IGNORED_USERS,
    IGNORED_REQUESTS,
  },
};

export interface SettingGroup {
  title: string;
  settings: SettingContent[];
}

export const LAYER_SETTINGS: SettingGroup = {
  title: CONFIG_LABELS.LAYER_SETTINGS,
  settings: [
    CONFIG.AUDIT.REST_LAYER,
    CONFIG.AUDIT.REST_DISABLED_CATEGORIES,
    CONFIG.AUDIT.TRANSPORT_LAYER,
    CONFIG.AUDIT.TRANSPORT_DISABLED_CATEGORIES,
  ],
};

export const ATTRIBUTE_SETTINGS: SettingGroup = {
  title: CONFIG_LABELS.ATTRIBUTE_SETTINGS,
  settings: [
    CONFIG.AUDIT.BULK_REQUESTS,
    CONFIG.AUDIT.REQUEST_BODY,
    CONFIG.AUDIT.RESOLVE_INDICES,
    CONFIG.AUDIT.SENSITIVE_HEADERS,
  ],
};

export const IGNORE_SETTINGS: SettingGroup = {
  title: CONFIG_LABELS.IGNORE_SETTINGS,
  settings: [CONFIG.AUDIT.IGNORED_USERS, CONFIG.AUDIT.IGNORED_REQUESTS],
};

export const SETTING_GROUPS = {
  AUDIT_SETTINGS: {
    settings: [CONFIG.ENABLED],
  },
  LAYER_SETTINGS,
  ATTRIBUTE_SETTINGS,
  IGNORE_SETTINGS,
};

export const SUB_URL_FOR_GENERAL_SETTINGS_EDIT = '/edit/generalSettings';
export const SUB_URL_FOR_COMPLIANCE_SETTINGS_EDIT = '/edit/complianceSettings';
