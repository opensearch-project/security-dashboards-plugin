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

export interface GeneralSettings {
  // layer
  enable_rest?: boolean;
  enable_transport?: boolean;
  disabled_rest_categories?: string[];
  disabled_transport_categories?: string[];

  // attribute
  resolve_bulk_requests?: boolean;
  resolve_indices?: boolean;
  log_request_body?: boolean;
  exclude_sensitive_headers?: boolean;

  // ignore
  ignore_users?: string[];
  ignore_requests?: string[];
}

export interface ComplianceSettings {
  enabled?: boolean;

  // read
  read_metadata_only?: boolean;
  read_ignore_users?: string[];
  read_watched_fields?: {
    [key: string]: string;
  };

  // write
  write_metadata_only?: boolean;
  write_log_diffs?: boolean;
  write_ignore_users?: string[];
  write_watched_indices?: string[];
}

export interface AuditLoggingSettings {
  enabled?: boolean;
  audit?: GeneralSettings;
  compliance?: ComplianceSettings;
}
