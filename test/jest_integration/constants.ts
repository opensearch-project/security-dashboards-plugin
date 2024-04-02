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

export const testAuditLogDisabledSettings = {
  enabled: false,
  audit: {
    enable_rest: false,
    disabled_rest_categories: ['FAILED_LOGIN', 'AUTHENTICATED'],
    enable_transport: true,
    disabled_transport_categories: ['GRANTED_PRIVILEGES'],
    resolve_bulk_requests: true,
    log_request_body: false,
    resolve_indices: true,
    exclude_sensitive_headers: true,
    ignore_users: ['admin'],
    ignore_requests: ['SearchRequest', 'indices:data/read/*'],
  },
  compliance: {
    enabled: true,
    internal_config: false,
    external_config: false,
    read_metadata_only: false,
    read_watched_fields: {
      indexName1: ['field1', 'fields-*'],
    },
    read_ignore_users: ['opensearchdashboardsserver', 'operator/*'],
    write_metadata_only: false,
    write_log_diffs: false,
    write_watched_indices: ['indexName2', 'indexPatterns-*'],
    write_ignore_users: ['admin'],
  },
};

export const testAuditLogEnabledSettings = {
  enabled: true,
  audit: {
    enable_rest: false,
    disabled_rest_categories: ['FAILED_LOGIN', 'AUTHENTICATED'],
    enable_transport: true,
    disabled_transport_categories: ['GRANTED_PRIVILEGES'],
    resolve_bulk_requests: true,
    log_request_body: false,
    resolve_indices: true,
    exclude_sensitive_headers: true,
    ignore_users: ['admin'],
    ignore_requests: ['SearchRequest', 'indices:data/read/*'],
  },
  compliance: {
    enabled: true,
    internal_config: false,
    external_config: false,
    read_metadata_only: false,
    read_watched_fields: {
      indexName1: ['field1', 'fields-*'],
    },
    read_ignore_users: ['opensearchdashboardsserver', 'operator/*'],
    write_metadata_only: false,
    write_log_diffs: false,
    write_watched_indices: ['indexName2', 'indexPatterns-*'],
    write_ignore_users: ['admin'],
  },
};
