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
import { pullAll } from 'lodash';

export const CONFIG_LABELS = {
  AUDIT_LOGGING: 'Audit logging',
  GENERAL_SETTINGS: 'General settings',
  LAYER_SETTINGS: 'Layer settings',
  ATTRIBUTE_SETTINGS: 'Attribute settings',
  IGNORE_SETTINGS: 'Ignore settings',
  COMPLIANCE_SETTINGS: 'Compliance settings',
  COMPLIANCE_MODE: 'Compliance mode',
  COMPLIANCE_CONFIG_SETTINGS: 'Config',
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

export interface SettingMapItem {
  key: string;
  value: string[];
}

export interface SettingContent {
  title: string;
  path: string;
  description: string;
  type: string;
  options?: string[];
  placeHolder?: string;
  code?: string;
  error?: string;
}

const REST_LAYER: SettingContent = {
  title: 'REST layer',
  path: 'audit.enable_rest',
  description: 'Enable or disable auditing events that happen on the REST layer.',
  type: 'bool',
};

const REST_DISABLED_CATEGORIES: SettingContent = {
  title: 'REST disabled categories',
  path: 'audit.disabled_rest_categories',
  description:
    'Specify audit categories which must be ignored on the REST layer. Modifying these could result in ' +
    'significant overhead.',
  type: 'array',
  options: [
    'BAD_HEADERS',
    'FAILED_LOGIN',
    'MISSING_PRIVILEGES',
    'GRANTED_PRIVILEGES',
    'SSL_EXCEPTION',
    'AUTHENTICATED',
  ],
  placeHolder: 'Select categories',
};

export function excludeFromDisabledRestCategories(optionsToExclude: string[]) {
  pullAll(REST_DISABLED_CATEGORIES.options || [], optionsToExclude);
}

const TRANSPORT_LAYER: SettingContent = {
  title: 'Transport layer',
  path: 'audit.enable_transport',
  description: 'Enable or disable auditing events that happen on the transport layer.',
  type: 'bool',
};

const TRANSPORT_DISABLED_CATEGORIES: SettingContent = {
  title: 'Transport disabled categories',
  path: 'audit.disabled_transport_categories',
  description:
    'Specify audit categories which must be ignored on the transport layer. Modifying these could result ' +
    'in significant overhead.',
  type: 'array',
  options: [
    'BAD_HEADERS',
    'FAILED_LOGIN',
    'GRANTED_PRIVILEGES',
    'INDEX_EVENT',
    'MISSING_PRIVILEGES',
    'SSL_EXCEPTION',
    'OPENDISTRO_SECURITY_INDEX_ATTEMPT',
    'AUTHENTICATED',
  ],
  placeHolder: 'Select categories',
};

export function excludeFromDisabledTransportCategories(optionsToExclude: string[]) {
  pullAll(TRANSPORT_DISABLED_CATEGORIES.options || [], optionsToExclude);
}

const BULK_REQUESTS: SettingContent = {
  title: 'Bulk requests',
  path: 'audit.resolve_bulk_requests',
  description:
    'Resolve bulk requests during auditing of requests. Enabling this will generate a log for each ' +
    'document request which could result in significant overhead.',
  type: 'bool',
};

const REQUEST_BODY: SettingContent = {
  title: 'Request body',
  path: 'audit.log_request_body',
  description: 'Include request body during auditing of requests.',
  type: 'bool',
};

const RESOLVE_INDICES: SettingContent = {
  title: 'Resolve indices',
  path: 'audit.resolve_indices',
  description: 'Resolve indices during auditing of requests.',
  type: 'bool',
};

const SENSITIVE_HEADERS: SettingContent = {
  title: 'Sensitive headers',
  path: 'audit.exclude_sensitive_headers',
  description: 'Exclude sensitive headers during auditing. (e.g. authorization header)',
  type: 'bool',
};

const IGNORED_USERS: SettingContent = {
  title: 'Ignored users',
  path: 'audit.ignore_users',
  description:
    'Users to ignore during auditing. Changing the defaults could result in significant overhead.',
  type: 'array',
  placeHolder: 'Add users or user patterns',
};

const IGNORED_REQUESTS: SettingContent = {
  title: 'Ignored requests',
  path: 'audit.ignore_requests',
  description: 'Request patterns to ignore during auditing.',
  type: 'array',
  placeHolder: 'Add request patterns',
};

const ENABLED: SettingContent = {
  title: 'Compliance logging',
  path: 'compliance.enabled',
  description: 'Enable or disable compliance logging.',
  type: 'bool',
};

const INTERNAL_CONFIG: SettingContent = {
  title: 'Internal config logging',
  path: 'compliance.internal_config',
  description: 'Enable or disable logging of events on internal security index.',
  type: 'bool',
};

const EXTERNAL_CONFIG: SettingContent = {
  title: 'External config logging',
  path: 'compliance.external_config',
  description: 'Enable or disable logging of external configuration.',
  type: 'bool',
};

const READ_METADATA_ONLY: SettingContent = {
  title: 'Read metadata',
  path: 'compliance.read_metadata_only',
  description: 'Do not log any document fields. Log only metadata of the document.',
  type: 'bool',
};

const READ_IGNORED_USERS: SettingContent = {
  title: 'Ignored users',
  path: 'compliance.read_ignore_users',
  description: 'Users to ignore during auditing.',
  type: 'array',
  placeHolder: 'Add users or user patterns',
};

const READ_WATCHED_FIELDS: SettingContent = {
  title: 'Watched fields',
  path: 'compliance.read_watched_fields',
  description:
    'List the indices and fields to watch during read events. Adding watched fields will generate one log per document' +
    ' access and could result in significant overhead. Sample data content:',
  type: 'map',
  code: `{
  "index-name-pattern": ["field-name-pattern"],
  "logs*": ["message"],
  "twitter": ["id", "user*"]
}`,
  error: 'Invalid content. Please check sample data content.',
};

const WRITE_METADATA_ONLY: SettingContent = {
  title: 'Write metadata',
  path: 'compliance.write_metadata_only',
  description: 'Do not log any document content. Log only metadata of the document.',
  type: 'bool',
};

const WRITE_LOG_DIFFS: SettingContent = {
  title: 'Log diffs',
  path: 'compliance.write_log_diffs',
  description: 'Log diffs for document updates.',
  type: 'bool',
};

const WRITE_IGNORED_USERS: SettingContent = {
  title: 'Ignored users',
  path: 'compliance.write_ignore_users',
  description: 'Users to ignore during auditing.',
  type: 'array',
  placeHolder: 'Add users or user patterns',
};

const WRITE_WATCHED_FIELDS: SettingContent = {
  title: 'Watch indices',
  path: 'compliance.write_watched_indices',
  description:
    'List the indices to watch during write events. Adding watched indices will generate one log per ' +
    'document access and could result in significant overhead.',
  type: 'array',
  placeHolder: 'Add indices',
};

export const CONFIG = {
  ENABLED: {
    title: 'Enable audit logging',
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
  COMPLIANCE: {
    ENABLED,
    INTERNAL_CONFIG,
    EXTERNAL_CONFIG,
    READ_METADATA_ONLY,
    READ_IGNORED_USERS,
    READ_WATCHED_FIELDS,
    WRITE_METADATA_ONLY,
    WRITE_LOG_DIFFS,
    WRITE_IGNORED_USERS,
    WRITE_WATCHED_FIELDS,
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

export const COMPLIANCE_CONFIG_MODE_SETTINGS: SettingGroup = {
  title: CONFIG_LABELS.COMPLIANCE_MODE,
  settings: [CONFIG.COMPLIANCE.ENABLED],
};

export const COMPLIANCE_CONFIG_SETTINGS: SettingGroup = {
  title: CONFIG_LABELS.COMPLIANCE_CONFIG_SETTINGS,
  settings: [CONFIG.COMPLIANCE.INTERNAL_CONFIG, CONFIG.COMPLIANCE.EXTERNAL_CONFIG],
};

export const COMPLIANCE_SETTINGS_READ: SettingGroup = {
  title: CONFIG_LABELS.COMPLIANCE_READ,
  settings: [
    CONFIG.COMPLIANCE.READ_METADATA_ONLY,
    CONFIG.COMPLIANCE.READ_IGNORED_USERS,
    CONFIG.COMPLIANCE.READ_WATCHED_FIELDS,
  ],
};

export const COMPLIANCE_SETTINGS_WRITE: SettingGroup = {
  title: CONFIG_LABELS.COMPLIANCE_WRITE,
  settings: [
    CONFIG.COMPLIANCE.WRITE_METADATA_ONLY,
    CONFIG.COMPLIANCE.WRITE_LOG_DIFFS,
    CONFIG.COMPLIANCE.WRITE_IGNORED_USERS,
    CONFIG.COMPLIANCE.WRITE_WATCHED_FIELDS,
  ],
};

export const SETTING_GROUPS = {
  AUDIT_SETTINGS: {
    settings: [CONFIG.ENABLED],
  },
  LAYER_SETTINGS,
  ATTRIBUTE_SETTINGS,
  IGNORE_SETTINGS,
  COMPLIANCE_CONFIG_MODE_SETTINGS,
  COMPLIANCE_CONFIG_SETTINGS,
  COMPLIANCE_SETTINGS_READ,
  COMPLIANCE_SETTINGS_WRITE,
};

export const SUB_URL_FOR_GENERAL_SETTINGS_EDIT = '/edit/generalSettings';
export const SUB_URL_FOR_COMPLIANCE_SETTINGS_EDIT = '/edit/complianceSettings';
