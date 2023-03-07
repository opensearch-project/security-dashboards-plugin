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

import {
  ILegacyClusterClient,
  SavedObjectsSerializer,
  ISavedObjectTypeRegistry,
  Logger,
} from '../../../../src/core/server';
import { IndexMapping } from '../../../../src/core/server/saved_objects/mappings';
import {
  DocumentMigrator,
  IndexMigrator,
  buildActiveMappings,
} from '../../../../src/core/server/saved_objects/migrations/core';
import { docValidator } from '../../../../src/core/server/saved_objects/validation';
import { createIndexMap } from '../../../../src/core/server/saved_objects/migrations/core/build_index_map';
import { mergeTypes } from '../../../../src/core/server/saved_objects/migrations/kibana/kibana_migrator';
// import { MigrationLogger } from '../../../../src/core/server/saved_objects/migrations/core/migration_logger';
import { SecurityClient } from '../backend/opendistro_security_client';
import { MAX_INTEGER } from '../../common';

export async function setupIndexTemplate(
  esClient: ILegacyClusterClient,
  kibanaIndex: string,
  typeRegistry: ISavedObjectTypeRegistry,
  logger: Logger
) {
  const mappings: IndexMapping = buildActiveMappings(mergeTypes(typeRegistry.getAllTypes()));
  try {
    await esClient.callAsInternalUser('indices.putIndexTemplate', {
      name: 'tenant_template',
      body: {
        // Setting priority to the max value to avoid being overridden by custom index templates.
        priority: MAX_INTEGER,
        index_patterns: [
          kibanaIndex + '_-*_*',
          kibanaIndex + '_0*_*',
          kibanaIndex + '_1*_*',
          kibanaIndex + '_2*_*',
          kibanaIndex + '_3*_*',
          kibanaIndex + '_4*_*',
          kibanaIndex + '_5*_*',
          kibanaIndex + '_6*_*',
          kibanaIndex + '_7*_*',
          kibanaIndex + '_8*_*',
          kibanaIndex + '_9*_*',
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
  kibanaVersion: string,
  esClient: ILegacyClusterClient,
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

  // follows the same approach in kibana_migrator.ts to initiate DocumentMigrator here
  // see: https://tiny.amazon.com/fdpo47ue/githelaskibablobd275srccore
  const documentMigrator = new DocumentMigrator({
    kibanaVersion,
    typeRegistry,
    // doc validation in kibana_migrator is initialized int saved_object_service at
    // https://tiny.amazon.com/1ienclahn/githelaskibablobd275srccore , cannot get it from plugin
    validateDoc: docValidator({}),
    log: logger,
  });

  for (const indexName of Object.keys(tenentInfo)) {
    const indexMap = createIndexMap({
      kibanaIndexName: indexName,
      indexMap: mergeTypes(typeRegistry.getAllTypes()),
      registry: typeRegistry,
    });

    // follows the same aporach in kibana_mirator.ts to construct IndexMigrator
    // see: https://tiny.amazon.com/iuarepiw/githelaskibablobd275srccore
    //
    // FIXME: hard code batchSize, pollInterval, and scrollDuration for now
    //        they are used to fetched from `migration.xxx` config, which is not accessible from new playform
    const indexMigrator = new IndexMigrator({
      batchSize: 100,
      callCluster: esClient.callAsInternalUser,
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
      //       to set status will be available in 7.10, for now, we fail Kibana
      //       process to indicate index migration error. Customer can fix their
      //       tenant indices in ES then restart Kibana.
      process.exit(1);
    }
  }
}
