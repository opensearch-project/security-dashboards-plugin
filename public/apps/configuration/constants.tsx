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

import { API_PREFIX } from '../../../common';
import { translateMessage } from '../translation-utils';

export const API_ENDPOINT = API_PREFIX + '/configuration';
export const API_ENDPOINT_ROLES = API_ENDPOINT + '/roles';
export const API_ENDPOINT_ROLESMAPPING = API_ENDPOINT + '/rolesmapping';
export const API_ENDPOINT_ACTIONGROUPS = API_ENDPOINT + '/actiongroups';
export const API_ENDPOINT_TENANTS = API_ENDPOINT + '/tenants';
export const API_ENDPOINT_MULTITENANCY = API_PREFIX + '/multitenancy/tenant';
export const API_ENDPOINT_TENANCY_CONFIGS = API_ENDPOINT + '/tenancy/config';
export const API_ENDPOINT_SECURITYCONFIG = API_ENDPOINT + '/securityconfig';
export const API_ENDPOINT_INTERNALUSERS = API_ENDPOINT + '/internalusers';
export const API_ENDPOINT_AUDITLOGGING = API_ENDPOINT + '/audit';
export const API_ENDPOINT_AUDITLOGGING_UPDATE = API_ENDPOINT_AUDITLOGGING + '/config';
export const API_ENDPOINT_PERMISSIONS_INFO = API_PREFIX + '/restapiinfo';
export const API_ENDPOINT_CACHE = API_ENDPOINT + '/cache';

export const CLUSTER_PERMISSIONS: string[] = [
  'cluster:admin/component_template/delete',
  'cluster:admin/component_template/get',
  'cluster:admin/component_template/put',
  'cluster:admin/decommission/awareness/delete',
  'cluster:admin/decommission/awareness/get',
  'cluster:admin/decommission/awareness/put',
  'cluster:admin/indices/dangling/delete',
  'cluster:admin/indices/dangling/find',
  'cluster:admin/indices/dangling/import',
  'cluster:admin/indices/dangling/list',
  'cluster:admin/ingest/pipeline/delete',
  'cluster:admin/ingest/pipeline/get',
  'cluster:admin/ingest/pipeline/put',
  'cluster:admin/ingest/pipeline/simulate',
  'cluster:admin/ingest/processor/grok/get',
  'cluster:admin/nodes/reload_secure_settings',
  'cluster:admin/persistent/completion',
  'cluster:admin/persistent/remove',
  'cluster:admin/persistent/start',
  'cluster:admin/persistent/update_status',
  'cluster:admin/remotestore/restore',
  'cluster:admin/opendistro/ad/detector/delete',
  'cluster:admin/opendistro/ad/detector/info',
  'cluster:admin/opendistro/ad/detector/jobmanagement',
  'cluster:admin/opendistro/ad/detector/preview',
  'cluster:admin/opendistro/ad/detector/run',
  'cluster:admin/opendistro/ad/detector/search',
  'cluster:admin/opendistro/ad/detector/stats',
  'cluster:admin/opendistro/ad/detector/write',
  'cluster:admin/opendistro/ad/detectors/get',
  'cluster:admin/opendistro/ad/detector/validate',
  'cluster:admin/opendistro/ad/result/search',
  'cluster:admin/opendistro/ad/result/topAnomalies',
  'cluster:admin/opendistro/ad/tasks/search',
  'cluster:admin/opendistro/alerting/alerts/ack',
  'cluster:admin/opendistro/alerting/alerts/get',
  'cluster:admin/opendistro/alerting/destination/delete',
  'cluster:admin/opendistro/alerting/destination/email_account/delete',
  'cluster:admin/opendistro/alerting/destination/email_account/get',
  'cluster:admin/opendistro/alerting/destination/email_account/search',
  'cluster:admin/opendistro/alerting/destination/email_account/write',
  'cluster:admin/opendistro/alerting/destination/email_group/delete',
  'cluster:admin/opendistro/alerting/destination/email_group/get',
  'cluster:admin/opendistro/alerting/destination/email_group/search',
  'cluster:admin/opendistro/alerting/destination/email_group/write',
  'cluster:admin/opendistro/alerting/destination/get',
  'cluster:admin/opendistro/alerting/destination/write',
  'cluster:admin/opendistro/alerting/monitor/delete',
  'cluster:admin/opendistro/alerting/monitor/execute',
  'cluster:admin/opendistro/alerting/monitor/get',
  'cluster:admin/opendistro/alerting/monitor/search',
  'cluster:admin/opendistro/alerting/monitor/write',
  'cluster:admin/opendistro/ism/managedindex/add',
  'cluster:admin/opendistro/ism/managedindex/change',
  'cluster:admin/opendistro/ism/managedindex/remove',
  'cluster:admin/opendistro/ism/managedindex/explain',
  'cluster:admin/opendistro/ism/managedindex/retry',
  'cluster:admin/opendistro/ism/policy/write',
  'cluster:admin/opendistro/ism/policy/get',
  'cluster:admin/opendistro/ism/policy/search',
  'cluster:admin/opendistro/ism/policy/delete',
  'cluster:admin/opensearch/controlcenter/lron/get',
  'cluster:admin/opensearch/controlcenter/lron/delete',
  'cluster:admin/opensearch/controlcenter/lron/write',
  'cluster:admin/opensearch/notifications/channels/get',
  'cluster:admin/opensearch/notifications/configs/create',
  'cluster:admin/opensearch/notifications/configs/delete',
  'cluster:admin/opensearch/notifications/configs/get',
  'cluster:admin/opensearch/notifications/configs/update',
  'cluster:admin/opensearch/notifications/features',
  'cluster:admin/opensearch/notifications/feature/send',
  'cluster:admin/opensearch/notifications/test_notification',
  'cluster:admin/opendistro/rollup/index',
  'cluster:admin/opendistro/rollup/get',
  'cluster:admin/opendistro/rollup/search',
  'cluster:admin/opendistro/rollup/delete',
  'cluster:admin/opendistro/rollup/start',
  'cluster:admin/opendistro/rollup/stop',
  'cluster:admin/opendistro/rollup/explain',
  'cluster:admin/opendistro/transform/delete',
  'cluster:admin/opendistro/transform/explain',
  'cluster:admin/opendistro/transform/get',
  'cluster:admin/opendistro/transform/get_transforms',
  'cluster:admin/opendistro/transform/index',
  'cluster:admin/opendistro/transform/preview',
  'cluster:admin/opendistro/transform/start',
  'cluster:admin/opendistro/transform/stop',
  'cluster:admin/opensearch/snapshot_management/policy/write',
  'cluster:admin/opensearch/snapshot_management/policy/get',
  'cluster:admin/opensearch/snapshot_management/policy/search',
  'cluster:admin/opensearch/snapshot_management/policy/delete',
  'cluster:admin/opensearch/snapshot_management/policy/explain',
  'cluster:admin/opensearch/snapshot_management/policy/start',
  'cluster:admin/opensearch/snapshot_management/policy/stop',
  'cluster:admin/opendistro/reports/definition/create',
  'cluster:admin/opendistro/reports/definition/update',
  'cluster:admin/opendistro/reports/definition/on_demand',
  'cluster:admin/opendistro/reports/definition/delete',
  'cluster:admin/opendistro/reports/definition/get',
  'cluster:admin/opendistro/reports/definition/list',
  'cluster:admin/opendistro/reports/instance/list',
  'cluster:admin/opendistro/reports/instance/get',
  'cluster:admin/opendistro/reports/menu/download',
  'cluster:admin/opensearch/ql/datasources/create',
  'cluster:admin/opensearch/ql/datasources/read',
  'cluster:admin/opensearch/ql/datasources/update',
  'cluster:admin/opensearch/ql/datasources/delete',
  'cluster:admin/opensearch/ppl',
  'cluster:admin/opensearch/ml/create_model_meta',
  'cluster:admin/opensearch/ml/execute',
  'cluster:admin/opensearch/ml/load_model',
  'cluster:admin/opensearch/ml/load_model_on_nodes',
  'cluster:admin/opensearch/ml/models/delete',
  'cluster:admin/opensearch/ml/models/get',
  'cluster:admin/opensearch/ml/models/search',
  'cluster:admin/opensearch/ml/predict',
  'cluster:admin/opensearch/ml/profile/nodes',
  'cluster:admin/opensearch/ml/stats/nodes',
  'cluster:admin/opensearch/ml/tasks/delete',
  'cluster:admin/opensearch/ml/tasks/get',
  'cluster:admin/opensearch/ml/tasks/search',
  'cluster:admin/opensearch/ml/train',
  'cluster:admin/opensearch/ml/trainAndPredict',
  'cluster:admin/opensearch/ml/unload_model',
  'cluster:admin/opensearch/ml/upload_model',
  'cluster:admin/opensearch/ml/upload_model_chunk',
  'cluster:admin/opensearch/observability/create',
  'cluster:admin/opensearch/observability/delete',
  'cluster:admin/opensearch/observability/get',
  'cluster:admin/opensearch/observability/update',
  'cluster:admin/reindex/rethrottle',
  'cluster:admin/repository/_cleanup',
  'cluster:admin/repository/delete',
  'cluster:admin/repository/get',
  'cluster:admin/repository/put',
  'cluster:admin/repository/verify',
  'cluster:admin/reroute',
  'cluster:admin/routing/awareness/weights/delete',
  'cluster:admin/routing/awareness/weights/get',
  'cluster:admin/routing/awareness/weights/put',
  'cluster:admin/script/delete',
  'cluster:admin/script/get',
  'cluster:admin/script/put',
  'cluster:admin/script_context/get',
  'cluster:admin/script_language/get',
  'cluster:admin/settings/update',
  'cluster:admin/snapshot/create',
  'cluster:admin/snapshot/clone',
  'cluster:admin/snapshot/delete',
  'cluster:admin/snapshot/get',
  'cluster:admin/snapshot/restore',
  'cluster:admin/snapshot/status',
  'cluster:admin/snapshot/status*',
  'cluster:admin/tasks/cancel',
  'cluster:admin/tasks/test',
  'cluster:admin/tasks/testunblock',
  'cluster:admin/voting_config/add_exclusions',
  'cluster:admin/voting_config/clear_exclusions',
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
  'cluster:monitor/tasks/list*',
  'restapi:admin/actiongroups',
  'restapi:admin/allowlist',
  'restapi:admin/internalusers',
  'restapi:admin/nodesdn',
  'restapi:admin/roles',
  'restapi:admin/rolesmapping',
  'restapi:admin/ssl/certs/info',
  'restapi:admin/ssl/certs/reload',
  'restapi:admin/tenants',
];

export function includeClusterPermissions(clusterPermissionsToInclude: string[]) {
  if (clusterPermissionsToInclude) {
    CLUSTER_PERMISSIONS.push(...clusterPermissionsToInclude);
  }
}

export const INDEX_PERMISSIONS: string[] = [
  'indices:admin/aliases',
  'indices:admin/aliases/exists',
  'indices:admin/aliases/get',
  'indices:admin/analyze',
  'indices:admin/auto_create',
  'indices:admin/block/add',
  'indices:admin/cache/clear',
  'indices:admin/close',
  'indices:admin/close*',
  'indices:admin/create',
  'indices:admin/data_stream/create',
  'indices:admin/data_stream/delete',
  'indices:admin/data_stream/get',
  'indices:admin/delete',
  'indices:admin/exists',
  'indices:admin/flush',
  'indices:admin/flush*',
  'indices:admin/forcemerge',
  'indices:admin/get',
  'indices:admin/index_template/delete',
  'indices:admin/index_template/get',
  'indices:admin/index_template/put',
  'indices:admin/index_template/simulate',
  'indices:admin/index_template/simulate_index',
  'indices:admin/mapping/auto_put',
  'indices:admin/mapping/put',
  'indices:admin/mappings/fields/get',
  'indices:admin/mappings/fields/get*',
  'indices:admin/mappings/get',
  'indices:admin/open',
  'indices:admin/refresh',
  'indices:admin/refresh*',
  'indices:admin/resize',
  'indices:admin/resolve/index',
  'indices:admin/rollover',
  'indices:admin/seq_no/global_checkpoint_sync',
  'indices:admin/seq_no/add_retention_lease',
  'indices:admin/seq_no/remove_retention_lease',
  'indices:admin/seq_no/renew_retention_lease',
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
  'indices:data/read/point_in_time/create',
  'indices:data/read/point_in_time/delete',
  'indices:data/read/point_in_time/readall',
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
  'indices:monitor/data_stream/stats',
  'indices:monitor/point_in_time/segments',
  'indices:monitor/recovery',
  'indices:monitor/segments',
  'indices:monitor/settings/get',
  'indices:monitor/shard_stores',
  'indices:monitor/stats',
  'indices:monitor/upgrade',
];

export function includeIndexPermissions(indexPermissionsToInclude: string[]) {
  if (indexPermissionsToInclude) {
    INDEX_PERMISSIONS.push(...indexPermissionsToInclude);
  }
}

export const TENANT_READ_PERMISSION = 'kibana_all_read';
export const TENANT_WRITE_PERMISSION = 'kibana_all_write';

export const LEARN_MORE = 'Learn more';

export const RoleViewTenantInvalidText = 'N/A';

// External Links
export const DocLinks = {
  BackendConfigurationDoc:
    'https://opensearch.org/docs/latest/security-plugin/configuration/configuration/',
  BackendConfigurationAuthenticationDoc:
    'https://opensearch.org/docs/latest/security-plugin/configuration/configuration/#authentication',
  BackendConfigurationAuthorizationDoc:
    'https://opensearch.org/docs/latest/security-plugin/configuration/configuration/#authorization',
  AuthenticationFlowDoc:
    'https://opensearch.org/docs/latest/security-plugin/configuration/concepts/',
  AccessControlDoc: 'https://opensearch.org/docs/latest/security-plugin/access-control/index/',
  UsersAndRolesDoc:
    'https://opensearch.org/docs/latest/security-plugin/access-control/users-roles/',
  CreateRolesDoc:
    'https://opensearch.org/docs/latest/security-plugin/access-control/users-roles/#create-roles',
  MapUsersToRolesDoc:
    'https://opensearch.org/docs/latest/security-plugin/access-control/users-roles/#map-users-to-roles',
  CreateUsersDoc:
    'https://opensearch.org/docs/latest/security-plugin/access-control/users-roles/#create-users',
  AuditLogsDoc: translateMessage(
    'audit.logs.docLink',
    'https://opensearch.org/docs/latest/security-plugin/audit-logs/'
  ),
  AuditLogsStorageDoc: translateMessage(
    'audit.logs.storageDocLink',
    'https://opensearch.org/docs/latest/security-plugin/audit-logs/storage-types/'
  ),
  PermissionsDoc:
    'https://opensearch.org/docs/latest/security-plugin/access-control/default-action-groups/',
  ClusterPermissionsDoc:
    'https://opensearch.org/docs/latest/security-plugin/access-control/default-action-groups/#cluster-level',
  IndexPermissionsDoc:
    'https://opensearch.org/docs/latest/security-plugin/access-control/default-action-groups/#index-level',
  DocumentLevelSecurityDoc:
    'https://opensearch.org/docs/latest/security-plugin/access-control/document-level-security/',
  TenantPermissionsDoc:
    'https://opensearch.org/docs/latest/security-plugin/multi-tenancy/multi-tenancy-config',
  MultiTenancyDoc: 'https://opensearch.org/docs/latest/security/multi-tenancy/tenant-index/',
  AttributeBasedSecurityDoc:
    'https://opensearch.org/docs/latest/security-plugin/access-control/document-level-security/#attribute-based-security',
  BackendRoleDoc:
    'https://opensearch.org/docs/latest/security-plugin/access-control/users-roles/#map-users-to-roles',
};

export enum ToolTipContent {
  DocumentLevelSecurity = 'Document-level security lets you restrict a role to a subset of documents in an index.',
  FieldLevelSecurity = 'Field-level security lets you control which document fields a user can see.',
}

export const MIN_NUMBER_OF_CHARS_IN_RESOURCE_NAME = 2;
export const MAX_NUMBER_OF_CHARS_IN_RESOURCE_NAME = 50;

export const LIMIT_WIDTH_INPUT_CLASS = 'limit-width-input';
