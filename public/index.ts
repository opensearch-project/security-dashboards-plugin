import { PluginInitializer, PluginInitializerContext} from 'kibana/public';
import { SecurityPlugin, SecurityPluginSetup, SecurityPluginStart } from './plugin';

export const plugin: PluginInitializer<SecurityPluginSetup, SecurityPluginStart> = (
  initializerContext: PluginInitializerContext
) => new SecurityPlugin(initializerContext);
