import {
  PluginInitializerContext,
  CoreSetup,
  CoreStart,
  Plugin,
  Logger,
  IClusterClient,
  KibanaRequest,
  LifecycleResponseFactory,
  OnPreAuthToolkit,
  SessionStorageFactory,
} from '../../../src/core/server';

import { OpendistroSecurityPluginSetup, OpendistroSecurityPluginStart } from './types';
import { defineRoutes } from './routes';
import { SecurityPluginConfigType } from '.';
import opendistro_security_configuratoin_plugin from './backend/opendistro_security_configuration_plugin';

export class OpendistroSecurityPlugin
  implements Plugin<OpendistroSecurityPluginSetup, OpendistroSecurityPluginStart> {
  private readonly logger: Logger;

  constructor(private readonly initializerContext: PluginInitializerContext) {
    this.logger = initializerContext.logger.get();
  }

  public async setup(core: CoreSetup) {
    this.logger.debug('opendistro_security: Setup');

    const config$ = this.initializerContext.config.create<SecurityPluginConfigType>();

    const securityConfigClient: IClusterClient = core.elasticsearch.createClient(
      'opendistro_security',
      {
        plugins: [opendistro_security_configuratoin_plugin]
      }
    );

    // cookie session handling
    const dummyCookieSessionStorageFactory: SessionStorageFactory<any> = await core.http.createCookieSessionStorageFactory({
      name: 'cookie_name',
      encryptionKey: 'abcdefghijklmnopqrstuvwxyz0123456789',
      validate: (sessionValue) => {
        // console.log(`sessionValue: ${sessionValue}`);
        return { isValid: true, path: '/' };
        // return { isValid: false };
      },
      isSecure: false,
    });

    const router = core.http.createRouter();

    // Register server side APIs
    defineRoutes(router, securityConfigClient, dummyCookieSessionStorageFactory);

    return {
      config$,
      securityConfigClient,
    };
  }

  public start(core: CoreStart) {
    this.logger.debug('opendistro_security: Started');
    return {};
  }

  public stop() { }

}
