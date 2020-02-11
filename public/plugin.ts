import { i18n } from '@kbn/i18n';
import { AppMountParameters, CoreSetup, CoreStart, Plugin, PluginInitializerContext, AppMountContext } from '../../../src/core/public';
import {
  OpendistroSecurityPluginSetup,
  OpendistroSecurityPluginStart,
  AppPluginStartDependencies,
} from './types';
import { PLUGIN_NAME } from '../common';

export class OpendistroSecurityPlugin
      implements Plugin<OpendistroSecurityPluginSetup, OpendistroSecurityPluginStart> {

  constructor(private readonly initializerContext: PluginInitializerContext) {}

  public setup(core: CoreSetup): OpendistroSecurityPluginSetup {
    core.application.register({
      id: "opendistro_security",
      title: "Security",
      order: 1,
      mount: async (context: AppMountContext, params: AppMountParameters) => {
        const { renderApp } = await import('./application');
        const [coreStart, depsStart] = await core.getStartServices();
        return renderApp(coreStart, depsStart as AppPluginStartDependencies, context, params);
      }
    });

    // Return methods that should be available to other plugins
    return {
    };
  }

  public start(core: CoreStart): OpendistroSecurityPluginStart {
    return {};
  }

  public stop() {}
}
