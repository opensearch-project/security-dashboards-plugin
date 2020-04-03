import {
  PluginInitializerContext,
  CoreSetup,
  CoreStart,
  Plugin,
  Logger,
  IClusterClient,
  SessionStorageFactory,
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

export class OpendistroSecurityPlugin
  implements Plugin<OpendistroSecurityPluginSetup, OpendistroSecurityPluginStart> {
  private readonly logger: Logger;

  constructor(private readonly initializerContext: PluginInitializerContext) {
    this.logger = initializerContext.logger.get();
  }

  public async setup(core: CoreSetup) {
    this.logger.debug('opendistro_security: Setup');

    const config$ = this.initializerContext.config.create<SecurityPluginConfigType>();
    const config: SecurityPluginConfigType = await config$.pipe(first()).toPromise();

    const router = core.http.createRouter();

    const securityClient: IClusterClient = core.elasticsearch.createClient(
      'opendistro_security',
      {
        plugins: [
          opendistro_security_configuratoin_plugin,
          // TODO need to add other endpoints such as multitenanct and other
          // FIXME: having multiple plugins caused the extended endpoints not working, currently 
          //        added all endpoints to opendistro_security_configuratoin_plugin as a workaround
          // opendistro_security_plugin,
        ],
      }
    );

    const securitySessionStorageFactory: SessionStorageFactory<SecuritySessionCookie>
        = await core.http.createCookieSessionStorageFactory<SecuritySessionCookie>(getSecurityCookieOptions(config));

    
    // Register server side APIs
    defineRoutes(router, securityClient);

    // test routes
    defineTestRoutes(router, securityClient, securitySessionStorageFactory, core);
    

    // setup auth
    if (config.auth.type === undefined || config.auth.type === '' || config.auth.type === 'basicauth') {
      // TODO: switch implementation according to configurations
      const auth = new BasicAuthentication(config, securitySessionStorageFactory, router, securityClient, core);
      core.http.registerAuth(auth.authHandler);
    }

    return {
      config$,
      securityConfigClient: securityClient,
    };
  }

  public start(core: CoreStart) {
    this.logger.debug('opendistro_security: Started');
    return {};
  }

  public stop() { }

}
