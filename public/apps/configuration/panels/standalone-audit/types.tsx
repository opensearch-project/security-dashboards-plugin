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

/**
 * Standalone audit logging settings.
 *
 * Unlike FGAC audit config (which lives in the .opendistro_security index and is
 * read/written via /_plugins/_security/api/audit/config), standalone audit config
 * lives in cluster settings and is read/written via `_cluster/settings`. These are
 * the runtime-configurable (dynamic) settings only — static settings that require a
 * node restart (enable_standalone, audit.type, action_groups, log4j.enable_mdc_routing)
 * are intentionally NOT exposed here.
 *
 * The shape mirrors AuditLoggingSettings so the existing view/edit-setting-group
 * renderers can be reused unchanged. The utils layer translates between this nested
 * shape and the flat cluster-settings keys.
 */

export interface StandaloneGeneralSettings {
  // layer
  enable_rest?: boolean;
  enable_transport?: boolean;

  // Unified disabled categories (preferred over the deprecated rest/transport split).
  disabled_categories?: string[];

  // attribute
  resolve_bulk_requests?: boolean;
  resolve_indices?: boolean;
  log_request_body?: boolean;
  exclude_sensitive_headers?: boolean;

  // ignore
  ignore_users?: string[];
  ignore_requests?: string[];
}

export interface StandaloneComplianceSettings {
  enabled?: boolean;

  // read
  read_metadata_only?: boolean;
  read_ignore_users?: string[];
  // NOTE: as a cluster setting this is List<String> (e.g. "index:field" patterns),
  // NOT the {index: [fields]} map used by the FGAC security-index API.
  read_watched_fields?: string[];

  // write
  write_metadata_only?: boolean;
  write_log_diffs?: boolean;
  write_ignore_users?: string[];
  write_watched_indices?: string[];
}

export interface StandaloneAuditSettings {
  enabled?: boolean;
  audit?: StandaloneGeneralSettings;
  compliance?: StandaloneComplianceSettings;
}
