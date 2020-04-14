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
  PluginInitializerContext,
  CoreSetup,
  CoreStart,
  Plugin,
  Logger,
  IClusterClient,
  SessionStorageFactory,
  SharedGlobalConfig,
} from '../../../src/core/server';

import { OpendistroSecurityPluginSetup, OpendistroSecurityPluginStart } from './types';
import { defineRoutes } from './routes';
import { SecurityPluginConfigType } from '.';
import opendistro_security_configuratoin_plugin from './backend/opendistro_security_configuration_plugin';
import opendistro_security_plugin from './backend/opendistro_security_plugin';
import { first } from 'rxjs/operators';
import { SecuritySessionCookie, getSecurityCookieOptions } from './session/security_cookie';
import { BasicAuthentication } from './auth/types/basic/basic_auth';
import { defineTestRoutes } from './routes/test_routes'; // TODO: remove this later
import { Observable } from 'rxjs';
import { SecurityClient } from './backend/opendistro_security_client';
import { SavedObjectsSerializer, ISavedObjectTypeRegistry } from '../../../src/core/server/saved_objects';
import { setupIndexTemplate, migrateTenantIndices } from './multitenancy/tenant_index';

export class OpendistroSecurityPlugin implements Plugin<OpendistroSecurityPluginSetup, OpendistroSecurityPluginStart> {
  private readonly logger: Logger;
  private config$: Observable<SecurityPluginConfigType>;
  // FIXME: keep an reference of admin client so that it can be used in start(), better to figureout a
  //        decent way to get adminClient in start. (maybe using return from setup?)
  private securityClient: SecurityClient;

  constructor(private readonly initializerContext: PluginInitializerContext) {
    this.logger = initializerContext.logger.get();
  }

  public async setup(core: CoreSetup) {
    this.logger.debug('opendistro_security: Setup');

    this.config$ = this.initializerContext.config.create<SecurityPluginConfigType>();
    const config: SecurityPluginConfigType = await this.config$.pipe(first()).toPromise();

    const router = core.http.createRouter();

    const esClient: IClusterClient = core.elasticsearch.createClient('opendistro_security', {
      plugins: [
        opendistro_security_configuratoin_plugin,
        // TODO need to add other endpoints such as multitenanct and other
        // FIXME: having multiple plugins caused the extended endpoints not working, currently
        //        added all endpoints to opendistro_security_configuratoin_plugin as a workaround
        // opendistro_security_plugin,
      ],
    });

    this.securityClient = new SecurityClient(esClient);

    const securitySessionStorageFactory: SessionStorageFactory<SecuritySessionCookie> = await core.http.createCookieSessionStorageFactory<
      SecuritySessionCookie
    >(getSecurityCookieOptions(config));

    // Register server side APIs
    defineRoutes(router, esClient);

    // test routes
    defineTestRoutes(router, esClient, securitySessionStorageFactory, core);

    // setup auth
    if (config.auth.type === undefined || config.auth.type === '' || config.auth.type === 'basicauth') {
      // TODO: switch implementation according to configurations
      const auth = new BasicAuthentication(config, securitySessionStorageFactory, router, esClient, core);
      core.http.registerAuth(auth.authHandler);
    }

    return {
      config$: this.config$,
      securityConfigClient: esClient,
    };
  }

  public async start(core: CoreStart) {
    this.logger.debug('opendistro_security: Started');
    const config = await this.config$.pipe(first()).toPromise();
    if (config.multitenancy.enabled) {
      const globalConfig$: Observable<SharedGlobalConfig> = this.initializerContext.config.legacy.globalConfig$;
      const globalConfig: SharedGlobalConfig = await globalConfig$.pipe(first()).toPromise();
      const kibanaIndex = globalConfig.kibana.index;
      const typeRegistry: ISavedObjectTypeRegistry = core.savedObjects.getTypeRegistry();
      const esClient = core.elasticsearch.legacy.client;

      setupIndexTemplate(esClient, kibanaIndex, typeRegistry, this.logger);

      const serializer: SavedObjectsSerializer = core.savedObjects.createSerializer();
      const kibanaVersion = this.initializerContext.env.packageInfo.version;
      migrateTenantIndices(kibanaVersion, esClient, this.securityClient, typeRegistry, serializer, this.logger);
    }

    return {};
  }

  public stop() {}
}
