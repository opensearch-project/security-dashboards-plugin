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

import { IClusterClient, SavedObjectsSerializer, ISavedObjectTypeRegistry, Logger } from '../../../../src/core/server';
import { IndexMapping } from '../../../../src/core/server/saved_objects/mappings';
import { DocumentMigrator, IndexMigrator, buildActiveMappings } from '../../../../src/core/server/saved_objects/migrations/core';
import { docValidator } from '../../../../src/core/server/saved_objects/validation';
import { createIndexMap } from '../../../../src/core/server/saved_objects/migrations/core/build_index_map';
import { mergeTypes } from '../../../../src/core/server/saved_objects/migrations/kibana/kibana_migrator';
import { MigrationLogger } from '../../../../src/core/server/saved_objects/migrations/core/migration_logger';
import { SecurityClient } from '../backend/opendistro_security_client';

export async function setupIndexTemplate(
  esClient: IClusterClient,
  kibanaIndex: string,
  typeRegistry: ISavedObjectTypeRegistry,
  logger: Logger
) {
  const mappings: IndexMapping = buildActiveMappings(mergeTypes(typeRegistry.getAllTypes()));
  try {
    await esClient.callAsInternalUser('indices.putTemplate', {
      name: 'tenant_template',
      body: {
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
        settings: {
          number_of_shards: 1,
        },
        mappings,
      },
    });
  } catch (error) {
    logger.error(error);
    throw error;
  }
}

export async function migrateTenantIndices(
  kibanaVersion: string,
  esClient: IClusterClient,
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
    kibanaVersion: kibanaVersion,
    typeRegistry: typeRegistry,
    // doc validation in kibana_migrator is initialized int saved_object_service at
    // https://tiny.amazon.com/1ienclahn/githelaskibablobd275srccore , cannot get it from plugin
    validateDoc: docValidator({}),
    log: logger,
  });

  Object.keys(tenentInfo).forEach(async (index_name, i, array) => {
    const indexMap = createIndexMap({
      kibanaIndexName: index_name,
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
      documentMigrator: documentMigrator,
      index: index_name,
      log: new MigrationLogger(logger),
      mappingProperties: indexMap[index_name].typeMappings,
      pollInterval: 1500, // millisec
      scrollDuration: '15m',
      serializer: serializer,
      obsoleteIndexTemplatePattern: undefined,
      convertToAliasScript: indexMap[index_name].script,
    });
    try {
      await indexMigrator.migrate();
    } catch (error) {
      logger.error(error);
      throw error;
    }
  });
}
