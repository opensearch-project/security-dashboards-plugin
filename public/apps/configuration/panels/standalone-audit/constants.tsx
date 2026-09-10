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

// Reuse the declarative setting types and renderers from the FGAC audit-logging panel.
import { SettingContent, SettingGroup } from '../audit-logging/constants';

export const STANDALONE_CONFIG_LABELS = {
  STANDALONE_AUDIT: 'Standalone audit logging',
  GENERAL_SETTINGS: 'General settings',
  LAYER_SETTINGS: 'Layer settings',
  ATTRIBUTE_SETTINGS: 'Attribute settings',
  IGNORE_SETTINGS: 'Ignore settings',
  COMPLIANCE_MODE: 'Compliance mode',
  COMPLIANCE_READ: 'Read',
  COMPLIANCE_WRITE: 'Write',
};

/**
 * Categories selectable for `disabled_categories`. Only REQUEST_AUDIT / TRANSPORT_AUDIT
 * are offered: they are the standalone event categories and are the only ones the backend
 * actually suppresses via disabled_categories (see checkRestFilter/checkTransportFilter).
 *
 * COMPLIANCE_* categories are intentionally NOT offered here — checkComplianceFilter never
 * consults disabled_categories, so listing them would be a misleading no-op. Compliance
 * events are controlled by the Compliance section instead (compliance.enabled, watched
 * indices/fields, ignore-users). Auth-only categories (AUTHENTICATED, GRANTED_PRIVILEGES,
 * FAILED_LOGIN, ...) are inert in standalone mode and likewise omitted.
 */
const STANDALONE_CATEGORY_OPTIONS = ['REQUEST_AUDIT', 'TRANSPORT_AUDIT'];

// ---- General (audit filter) settings ------------------------------------------------

const REST_LAYER: SettingContent = {
  title: 'REST layer',
  path: 'audit.enable_rest',
  description: 'Enable or disable auditing events that happen on the REST layer.',
  type: 'bool',
};

const TRANSPORT_LAYER: SettingContent = {
  title: 'Transport layer',
  path: 'audit.enable_transport',
  description: 'Enable or disable auditing events that happen on the transport layer.',
  type: 'bool',
};

const DISABLED_CATEGORIES: SettingContent = {
  title: 'Disabled categories',
  path: 'audit.disabled_categories',
  description:
    'Audit categories to ignore across both REST and transport layers. ' +
    'This unified setting replaces the deprecated REST/transport split.',
  type: 'array',
  options: STANDALONE_CATEGORY_OPTIONS,
  placeHolder: 'Select categories',
};

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

// ---- Compliance settings ------------------------------------------------------------

const COMPLIANCE_ENABLED: SettingContent = {
  title: 'Compliance logging',
  path: 'compliance.enabled',
  description: 'Enable or disable compliance logging.',
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
  description: 'Users to ignore during read auditing.',
  type: 'array',
  placeHolder: 'Add users or user patterns',
};

const READ_WATCHED_FIELDS: SettingContent = {
  title: 'Watched fields',
  path: 'compliance.read_watched_fields',
  description:
    'Index and field patterns to watch during read events, e.g. "logs*:message". ' +
    'Adding watched fields generates one log per document access and could result in significant overhead.',
  type: 'array',
  placeHolder: 'Add index:field patterns',
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
  description: 'Users to ignore during write auditing.',
  type: 'array',
  placeHolder: 'Add users or user patterns',
};

const WRITE_WATCHED_INDICES: SettingContent = {
  title: 'Watch indices',
  path: 'compliance.write_watched_indices',
  description:
    'Indices to watch during write events. Adding watched indices generates one log per ' +
    'document write and could result in significant overhead.',
  type: 'array',
  placeHolder: 'Add indices',
};

export const CONFIG = {
  ENABLED: {
    title: 'Enable standalone audit logging',
    path: 'enabled',
    description: 'Enable or disable audit logging.',
    type: 'bool',
  } as SettingContent,
  AUDIT: {
    REST_LAYER,
    TRANSPORT_LAYER,
    DISABLED_CATEGORIES,
    BULK_REQUESTS,
    REQUEST_BODY,
    RESOLVE_INDICES,
    SENSITIVE_HEADERS,
    IGNORED_USERS,
    IGNORED_REQUESTS,
  },
  COMPLIANCE: {
    COMPLIANCE_ENABLED,
    READ_METADATA_ONLY,
    READ_IGNORED_USERS,
    READ_WATCHED_FIELDS,
    WRITE_METADATA_ONLY,
    WRITE_LOG_DIFFS,
    WRITE_IGNORED_USERS,
    WRITE_WATCHED_INDICES,
  },
};

export const LAYER_SETTINGS: SettingGroup = {
  title: STANDALONE_CONFIG_LABELS.LAYER_SETTINGS,
  settings: [
    CONFIG.AUDIT.REST_LAYER,
    CONFIG.AUDIT.TRANSPORT_LAYER,
    CONFIG.AUDIT.DISABLED_CATEGORIES,
  ],
};

export const ATTRIBUTE_SETTINGS: SettingGroup = {
  title: STANDALONE_CONFIG_LABELS.ATTRIBUTE_SETTINGS,
  settings: [
    CONFIG.AUDIT.BULK_REQUESTS,
    CONFIG.AUDIT.REQUEST_BODY,
    CONFIG.AUDIT.RESOLVE_INDICES,
    CONFIG.AUDIT.SENSITIVE_HEADERS,
  ],
};

export const IGNORE_SETTINGS: SettingGroup = {
  title: STANDALONE_CONFIG_LABELS.IGNORE_SETTINGS,
  settings: [CONFIG.AUDIT.IGNORED_USERS, CONFIG.AUDIT.IGNORED_REQUESTS],
};

export const COMPLIANCE_CONFIG_MODE_SETTINGS: SettingGroup = {
  title: STANDALONE_CONFIG_LABELS.COMPLIANCE_MODE,
  settings: [CONFIG.COMPLIANCE.COMPLIANCE_ENABLED],
};

export const COMPLIANCE_SETTINGS_READ: SettingGroup = {
  title: STANDALONE_CONFIG_LABELS.COMPLIANCE_READ,
  settings: [
    CONFIG.COMPLIANCE.READ_METADATA_ONLY,
    CONFIG.COMPLIANCE.READ_IGNORED_USERS,
    CONFIG.COMPLIANCE.READ_WATCHED_FIELDS,
  ],
};

export const COMPLIANCE_SETTINGS_WRITE: SettingGroup = {
  title: STANDALONE_CONFIG_LABELS.COMPLIANCE_WRITE,
  settings: [
    CONFIG.COMPLIANCE.WRITE_METADATA_ONLY,
    CONFIG.COMPLIANCE.WRITE_LOG_DIFFS,
    CONFIG.COMPLIANCE.WRITE_IGNORED_USERS,
    CONFIG.COMPLIANCE.WRITE_WATCHED_INDICES,
  ],
};

export const SETTING_GROUPS = {
  STANDALONE_AUDIT_SETTINGS: {
    settings: [CONFIG.ENABLED],
  },
  LAYER_SETTINGS,
  ATTRIBUTE_SETTINGS,
  IGNORE_SETTINGS,
  COMPLIANCE_CONFIG_MODE_SETTINGS,
  COMPLIANCE_SETTINGS_READ,
  COMPLIANCE_SETTINGS_WRITE,
};

/**
 * Maps each UI config path to its flat cluster-settings key and value type.
 *
 * The UI works in a nested { enabled, audit: {...}, compliance: {...} } shape, while
 * `_cluster/settings` uses flat keys such as "plugins.security.audit.config.log_request_body".
 * The utils layer uses this table to translate in both directions and to coerce values
 * (booleans come back from _cluster/settings as the strings "true"/"false").
 */
export interface ClusterSettingMapping {
  key: string;
  type: 'bool' | 'array';
}

export const CLUSTER_SETTINGS_KEY_MAP: { [uiPath: string]: ClusterSettingMapping } = {
  enabled: { key: 'plugins.security.audit.enabled', type: 'bool' },

  'audit.enable_rest': { key: 'plugins.security.audit.config.enable_rest', type: 'bool' },
  'audit.enable_transport': { key: 'plugins.security.audit.config.enable_transport', type: 'bool' },
  'audit.disabled_categories': {
    key: 'plugins.security.audit.config.disabled_categories',
    type: 'array',
  },
  'audit.resolve_bulk_requests': {
    key: 'plugins.security.audit.config.resolve_bulk_requests',
    type: 'bool',
  },
  'audit.log_request_body': {
    key: 'plugins.security.audit.config.log_request_body',
    type: 'bool',
  },
  'audit.resolve_indices': { key: 'plugins.security.audit.config.resolve_indices', type: 'bool' },
  'audit.exclude_sensitive_headers': {
    key: 'plugins.security.audit.config.exclude_sensitive_headers',
    type: 'bool',
  },
  'audit.ignore_users': { key: 'plugins.security.audit.config.ignore_users', type: 'array' },
  'audit.ignore_requests': { key: 'plugins.security.audit.config.ignore_requests', type: 'array' },

  'compliance.enabled': { key: 'plugins.security.audit.compliance.enabled', type: 'bool' },
  'compliance.read_metadata_only': {
    key: 'plugins.security.audit.compliance.read_metadata_only',
    type: 'bool',
  },
  'compliance.read_ignore_users': {
    key: 'plugins.security.audit.compliance.read_ignore_users',
    type: 'array',
  },
  'compliance.read_watched_fields': {
    key: 'plugins.security.audit.compliance.read_watched_fields',
    type: 'array',
  },
  'compliance.write_metadata_only': {
    key: 'plugins.security.audit.compliance.write_metadata_only',
    type: 'bool',
  },
  'compliance.write_log_diffs': {
    key: 'plugins.security.audit.compliance.write_log_diffs',
    type: 'bool',
  },
  'compliance.write_ignore_users': {
    key: 'plugins.security.audit.compliance.write_ignore_users',
    type: 'array',
  },
  'compliance.write_watched_indices': {
    key: 'plugins.security.audit.compliance.write_watched_indices',
    type: 'array',
  },
};

export const SUB_URL_FOR_GENERAL_SETTINGS_EDIT = '/edit/generalSettings';
export const SUB_URL_FOR_COMPLIANCE_SETTINGS_EDIT = '/edit/complianceSettings';
