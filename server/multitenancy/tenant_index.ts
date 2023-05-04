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

import {
  OpenSearchClient,
  ISavedObjectTypeRegistry,
  Logger,
  SavedObjectsSerializer,
} from '../../../../src/core/server';
import { IndexMapping } from '../../../../src/core/server/saved_objects/mappings';
import {
  buildActiveMappings,
  DocumentMigrator,
  IndexMigrator,
  MigrationOpenSearchClient,
} from '../../../../src/core/server/saved_objects/migrations/core';
import { createIndexMap } from '../../../../src/core/server/saved_objects/migrations/core/build_index_map';
import { mergeTypes } from '../../../../src/core/server/saved_objects/migrations/opensearch_dashboards/opensearch_dashboards_migrator';
import { SecurityClient } from '../backend/opensearch_security_client';
import { MAX_INTEGER } from '../../common';

export async function setupIndexTemplate(
  esClient: OpenSearchClient,
  opensearchDashboardsIndex: string,
  typeRegistry: ISavedObjectTypeRegistry,
  logger: Logger
) {
  const mappings: IndexMapping = buildActiveMappings(mergeTypes(typeRegistry.getAllTypes()));
  try {
    await esClient.indices.putIndexTemplate({
      name: 'tenant_template',
      body: {
        // Setting priority to the max value to avoid being overridden by custom index templates.
        priority: MAX_INTEGER,
        index_patterns: [
          opensearchDashboardsIndex + '_-*_*',
          opensearchDashboardsIndex + '_0*_*',
          opensearchDashboardsIndex + '_1*_*',
          opensearchDashboardsIndex + '_2*_*',
          opensearchDashboardsIndex + '_3*_*',
          opensearchDashboardsIndex + '_4*_*',
          opensearchDashboardsIndex + '_5*_*',
          opensearchDashboardsIndex + '_6*_*',
          opensearchDashboardsIndex + '_7*_*',
          opensearchDashboardsIndex + '_8*_*',
          opensearchDashboardsIndex + '_9*_*',
        ],
        template: {
          settings: {
            number_of_shards: 1,
          },
          mappings,
        },
      },
    });
  } catch (error) {
    logger.error(error);
    throw error;
  }
}

export async function migrateTenantIndices(
  opensearchDashboardsVersion: string,
  migrationClient: MigrationOpenSearchClient,
  securityClient: SecurityClient,
  typeRegistry: ISavedObjectTypeRegistry,
  serializer: SavedObjectsSerializer,
  logger: Logger
) {
  let tenentInfo: any;
  try {
    tenentInfo = await securityClient.getTenantInfoWithInternalUser();
  } catch (error) {
    logger.error(error);
    throw error;
  }

  // follows the same approach in opensearch_dashboards_migrator.ts to initiate DocumentMigrator here
  const documentMigrator = new DocumentMigrator({
    opensearchDashboardsVersion,
    typeRegistry,
    log: logger,
  });

  for (const indexName of Object.keys(tenentInfo)) {
    const indexMap = createIndexMap({
      opensearchDashboardsIndexName: indexName,
      indexMap: mergeTypes(typeRegistry.getAllTypes()),
      registry: typeRegistry,
    });

    // follows the same aporach in opensearch_dashboards_mirator.ts to construct IndexMigrator
    //
    // FIXME: hard code batchSize, pollInterval, and scrollDuration for now
    //        they are used to fetched from `migration.xxx` config, which is not accessible from new playform
    const indexMigrator = new IndexMigrator({
      batchSize: 100,
      client: migrationClient,
      documentMigrator,
      index: indexName,
      log: logger,
      mappingProperties: indexMap[indexName].typeMappings,
      pollInterval: 1500, // millisec
      scrollDuration: '15m',
      serializer,
      obsoleteIndexTemplatePattern: undefined,
      convertToAliasScript: indexMap[indexName].script,
    });
    try {
      await indexMigrator.migrate();
    } catch (error) {
      logger.error(error);
      // fail early, exit the kibana process
      // NOTE: according to https://github.com/elastic/kibana/issues/41983 ,
      //       PR https://github.com/elastic/kibana/pull/75819 , API to allow plugins
      //       to set status will be available in 7.10, for now, we fail OpenSearchDashboards
      //       process to indicate index migration error. Customer can fix their
      //       tenant indices in ES then restart OpenSearchDashboards.
      process.exit(1);
    }
  }
}
