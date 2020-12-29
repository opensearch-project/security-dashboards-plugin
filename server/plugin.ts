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

import { first } from 'rxjs/operators';
import { Observable } from 'rxjs';
import {
  PluginInitializerContext,
  CoreSetup,
  CoreStart,
  Plugin,
  Logger,
  ILegacyClusterClient,
  SessionStorageFactory,
  SharedGlobalConfig,
} from '../../../src/core/server';

import { OpendistroSecurityPluginSetup, OpendistroSecurityPluginStart } from './types';
import { defineRoutes } from './routes';
import { SecurityPluginConfigType } from '.';
import opendistroSecurityConfiguratoinPlugin from './backend/opendistro_security_configuration_plugin';
import opendistroSecurityPlugin from './backend/opendistro_security_plugin';
import { SecuritySessionCookie, getSecurityCookieOptions } from './session/security_cookie';
import { SecurityClient } from './backend/opendistro_security_client';
import {
  SavedObjectsSerializer,
  ISavedObjectTypeRegistry,
} from '../../../src/core/server/saved_objects';
import { setupIndexTemplate, migrateTenantIndices } from './multitenancy/tenant_index';
import { IAuthenticationType } from './auth/types/authentication_type';
import { getAuthenticationHandler } from './auth/auth_handler_factory';
import { setupMultitenantRoutes } from './multitenancy/routes';
import { defineAuthTypeRoutes } from './routes/auth_type_routes';
import { createMigrationEsClient } from '../../../src/core/server/saved_objects/migrations/core';

export interface SecurityPluginRequestContext {
  logger: Logger;
  esClient: ILegacyClusterClient;
}

declare module 'kibana/server' {
  interface RequestHandlerContext {
    security_plugin: SecurityPluginRequestContext;
  }
}

export interface SecurityPluginRequestContext {
  logger: Logger;
}

declare module 'kibana/server' {
  interface RequestHandlerContext {
    security_plugin: SecurityPluginRequestContext;
  }
}

export class OpendistroSecurityPlugin
  implements Plugin<OpendistroSecurityPluginSetup, OpendistroSecurityPluginStart> {
  private readonly logger: Logger;
  // FIXME: keep an reference of admin client so that it can be used in start(), better to figureout a
  //        decent way to get adminClient in start. (maybe using getStartServices() from setup?)

  // @ts-ignore: property not initialzied in constructor
  private securityClient: SecurityClient;

  constructor(private readonly initializerContext: PluginInitializerContext) {
    this.logger = initializerContext.logger.get();
  }

  public async setup(core: CoreSetup) {
    this.logger.debug('opendistro_security: Setup');

    const config$ = this.initializerContext.config.create<SecurityPluginConfigType>();
    const config: SecurityPluginConfigType = await config$.pipe(first()).toPromise();

    const router = core.http.createRouter();

    const esClient: ILegacyClusterClient = core.elasticsearch.legacy.createClient(
      'opendistro_security',
      {
        plugins: [opendistroSecurityConfiguratoinPlugin, opendistroSecurityPlugin],
      }
    );

    this.securityClient = new SecurityClient(esClient);

    const securitySessionStorageFactory: SessionStorageFactory<SecuritySessionCookie> = await core.http.createCookieSessionStorageFactory<
      SecuritySessionCookie
    >(getSecurityCookieOptions(config));

    // put logger into route handler context, so that we don't need to pass througth parameters
    core.http.registerRouteHandlerContext('security_plugin', (context, request) => {
      return {
        logger: this.logger,
        esClient,
      };
    });

    // setup auth
    const auth: IAuthenticationType = getAuthenticationHandler(
      config.auth.type,
      router,
      config,
      core,
      esClient,
      securitySessionStorageFactory,
      this.logger
    );
    core.http.registerAuth(auth.authHandler);

    // Register server side APIs
    defineRoutes(router);
    defineAuthTypeRoutes(router, config);
    // set up multi-tenent routes
    if (config.multitenancy?.enabled) {
      setupMultitenantRoutes(router, securitySessionStorageFactory, this.securityClient);
    }

    return {
      config$,
      securityConfigClient: esClient,
    };
  }

  // TODO: add more logs
  public async start(core: CoreStart) {
    this.logger.debug('opendistro_security: Started');
    const config$ = this.initializerContext.config.create<SecurityPluginConfigType>();
    const config = await config$.pipe(first()).toPromise();
    if (config.multitenancy?.enabled) {
      const globalConfig$: Observable<SharedGlobalConfig> = this.initializerContext.config.legacy
        .globalConfig$;
      const globalConfig: SharedGlobalConfig = await globalConfig$.pipe(first()).toPromise();
      const kibanaIndex = globalConfig.kibana.index;
      const typeRegistry: ISavedObjectTypeRegistry = core.savedObjects.getTypeRegistry();
      const esClient = core.elasticsearch.client.asInternalUser;
      const migrationClient = createMigrationEsClient(esClient, this.logger);

      setupIndexTemplate(esClient, kibanaIndex, typeRegistry, this.logger);

      const serializer: SavedObjectsSerializer = core.savedObjects.createSerializer();
      const kibanaVersion = this.initializerContext.env.packageInfo.version;
      migrateTenantIndices(
        kibanaVersion,
        migrationClient,
        this.securityClient,
        typeRegistry,
        serializer,
        this.logger
      );
    }

    return {
      es: core.elasticsearch.legacy,
    };
  }

  public stop() {}
}
