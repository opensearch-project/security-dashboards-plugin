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

import { API_PREFIX } from '../../../common';

export const API_ENDPOINT = API_PREFIX + '/configuration';
export const API_ENDPOINT_ROLES = API_ENDPOINT + '/roles';
export const API_ENDPOINT_ROLESMAPPING = API_ENDPOINT + '/rolesmapping';
export const API_ENDPOINT_ACTIONGROUPS = API_ENDPOINT + '/actiongroups';
export const API_ENDPOINT_TENANTS = API_ENDPOINT + '/tenants';
export const API_ENDPOINT_MULTITENANCY = API_PREFIX + '/multitenancy/tenant';
export const API_ENDPOINT_SECURITYCONFIG = API_ENDPOINT + '/securityconfig';
export const API_ENDPOINT_INTERNALUSERS = API_ENDPOINT + '/internalusers';
export const API_ENDPOINT_AUDITLOGGING = API_ENDPOINT + '/audit';
export const API_ENDPOINT_AUDITLOGGING_UPDATE = API_ENDPOINT_AUDITLOGGING + '/config';
export const API_ENDPOINT_PERMISSIONS_INFO = API_PREFIX + '/restapiinfo';

export const CLUSTER_PERMISSIONS = [
  'cluster:admin/ingest/pipeline/delete',
  'cluster:admin/ingest/pipeline/get',
  'cluster:admin/ingest/pipeline/put',
  'cluster:admin/ingest/pipeline/simulate',
  'cluster:admin/ingest/processor/grok/get',
  'cluster:admin/reindex/rethrottle',
  'cluster:admin/repository/delete',
  'cluster:admin/repository/get',
  'cluster:admin/repository/put',
  'cluster:admin/repository/verify',
  'cluster:admin/reroute',
  'cluster:admin/script/delete',
  'cluster:admin/script/get',
  'cluster:admin/script/put',
  'cluster:admin/settings/update',
  'cluster:admin/snapshot/create',
  'cluster:admin/snapshot/delete',
  'cluster:admin/snapshot/get',
  'cluster:admin/snapshot/restore',
  'cluster:admin/snapshot/status',
  'cluster:admin/snapshot/status*',
  'cluster:admin/tasks/cancel',
  'cluster:admin/tasks/test',
  'cluster:admin/tasks/testunblock',
  'cluster:monitor/allocation/explain',
  'cluster:monitor/health',
  'cluster:monitor/main',
  'cluster:monitor/nodes/hot_threads',
  'cluster:monitor/nodes/info',
  'cluster:monitor/nodes/liveness',
  'cluster:monitor/nodes/stats',
  'cluster:monitor/nodes/usage',
  'cluster:monitor/remote/info',
  'cluster:monitor/state',
  'cluster:monitor/stats',
  'cluster:monitor/task',
  'cluster:monitor/task/get',
  'cluster:monitor/tasks/list',
];

export const INDEX_PERMISSIONS = [
  'indices:admin/aliases',
  'indices:admin/aliases/exists',
  'indices:admin/aliases/get',
  'indices:admin/analyze',
  'indices:admin/cache/clear',
  'indices:admin/close',
  'indices:admin/create',
  'indices:admin/delete',
  'indices:admin/exists',
  'indices:admin/flush',
  'indices:admin/flush*',
  'indices:admin/forcemerge',
  'indices:admin/get',
  'indices:admin/mapping/put',
  'indices:admin/mappings/fields/get',
  'indices:admin/mappings/fields/get*',
  'indices:admin/mappings/get',
  'indices:admin/open',
  'indices:admin/refresh',
  'indices:admin/refresh*',
  'indices:admin/rollover',
  'indices:admin/seq_no/global_checkpoint_sync',
  'indices:admin/settings/update',
  'indices:admin/shards/search_shards',
  'indices:admin/shrink',
  'indices:admin/synced_flush',
  'indices:admin/template/delete',
  'indices:admin/template/get',
  'indices:admin/template/put',
  'indices:admin/types/exists',
  'indices:admin/upgrade',
  'indices:admin/validate/query',
  'indices:data/read/explain',
  'indices:data/read/field_caps',
  'indices:data/read/field_caps*',
  'indices:data/read/get',
  'indices:data/read/mget',
  'indices:data/read/mget*',
  'indices:data/read/msearch',
  'indices:data/read/msearch/template',
  'indices:data/read/mtv',
  'indices:data/read/mtv*',
  'indices:data/read/scroll',
  'indices:data/read/scroll/clear',
  'indices:data/read/search',
  'indices:data/read/search*',
  'indices:data/read/search/template',
  'indices:data/read/tv',
  'indices:data/write/bulk',
  'indices:data/write/bulk*',
  'indices:data/write/delete',
  'indices:data/write/delete/byquery',
  'indices:data/write/index',
  'indices:data/write/reindex',
  'indices:data/write/update',
  'indices:data/write/update/byquery',
  'indices:monitor/recovery',
  'indices:monitor/segments',
  'indices:monitor/settings/get',
  'indices:monitor/shard_stores',
  'indices:monitor/stats',
  'indices:monitor/upgrade',
];

export const TENANT_READ_PERMISSION = 'kibana_all_read';
export const TENANT_WRITE_PERMISSION = 'kibana_all_write';

export const LEARN_MORE = 'Learn more';

export const RoleViewTenantInvalidText = 'N/A';

// External Links
export enum DocLinks {
  BackendConfigurationDoc = 'https://opendistro.github.io/for-elasticsearch-docs/docs/security/configuration/configuration/',
  BackendConfigurationAuthenticationDoc = 'https://opendistro.github.io/for-elasticsearch-docs/docs/security/configuration/configuration/#authentication',
  BackendConfigurationAuthorizationDoc = 'https://opendistro.github.io/for-elasticsearch-docs/docs/security/configuration/configuration/#authorization',
  AuthenticationFlowDoc = 'https://opendistro.github.io/for-elasticsearch-docs/docs/security/configuration/concepts/',
  CreateRolesDoc = 'https://opendistro.github.io/for-elasticsearch-docs/docs/security/access-control/users-roles/#create-roles',
  MapUsersToRolesDoc = 'https://opendistro.github.io/for-elasticsearch-docs/docs/security/access-control/users-roles/#map-users-to-roles',
  AuditLogsDoc = 'https://opendistro.github.io/for-elasticsearch-docs/docs/security/audit-logs/',
  AuditLogsStorageDoc = 'https://opendistro.github.io/for-elasticsearch-docs/docs/security/audit-logs/storage-types/',
}

export enum ToolTipContent {
  DocumentLevelSecurity = 'Document-level security lets you restrict a role to a subset of documents in an index.',
  FieldLevelSecurity = 'Field-level security lets you control which document fields a user can see.',
}
