import { PluginInitializerContext } from '../../../src/core/server';
import { OpendistroSecurityPlugin } from './plugin';

//  This exports static code and TypeScript types,
//  as well as, Kibana Platform `plugin()` initializer.

export function plugin(initializerContext: PluginInitializerContext) {
  return new OpendistroSecurityPlugin(initializerContext);
}

export { OpendistroSecurityPluginSetup, OpendistroSecurityPluginStart } from './types';
