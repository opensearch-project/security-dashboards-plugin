import {
  PluginInitializerContext,
  CoreSetup,
  CoreStart,
  Plugin,
  Logger,
} from '../../../src/core/server';

import { OpendistroSecurityPluginSetup, OpendistroSecurityPluginStart } from './types';
import { defineRoutes } from './routes';
import { SecurityPluginConfigType } from '.';

export class OpendistroSecurityPlugin
    implements Plugin<OpendistroSecurityPluginSetup, OpendistroSecurityPluginStart> {
  private readonly logger: Logger;

  constructor(private readonly initializerContext: PluginInitializerContext) {
    this.logger = initializerContext.logger.get();
  }

  public setup(core: CoreSetup) {
    this.logger.debug('opendistro_security: Setup');
    
    const config$ = this.initializerContext.config.create<SecurityPluginConfigType>();

    const router = core.http.createRouter();

    // Register server side APIs
    defineRoutes(router);

    return {
      config$,
    };
  }

  public start(core: CoreStart) {
    this.logger.debug('opendistro_security: Started');
    return {};
  }

  public stop() {}
}
