import './index.scss';

import { OpendistroSecurityPlugin } from './plugin';
import { PluginInitializerContext } from '../../../src/core/public';

// This exports static code and TypeScript types,
// as well as, Kibana Platform `plugin()` initializer.
export function plugin(initializerContext: PluginInitializerContext) {
  return new OpendistroSecurityPlugin(initializerContext);
}
export { OpendistroSecurityPluginSetup, OpendistroSecurityPluginStart } from './types';
