import {
  Plugin,
  CoreSetup,
  CoreStart,
  PluginInitializerContext,
  AppMountContext,
  AppMountParameters
} from 'kibana/public';


export class SecurityPlugin implements Plugin<SecurityPluginSetup, SecurityPluginStart> {

  constructor(private readonly initializerContext: PluginInitializerContext) {}

  public async setup(core: CoreSetup, deps: {}) {
    
    core.application.register({
      id: "security_management_app",
      title: "Security",
      order: 1,
      mount: async (context: AppMountContext, params: AppMountParameters) => {
        const { renderApp } = await import('./security-management/security-management');
        return renderApp(params.element, context, params.appBasePath);
      }
    });

    return {};
  }

  public start(core: CoreStart) {
    // eslint-disable-next-line no-console
    console.log(`Security plugin started`);
  }

  public stop() {}
}

export type SecurityPluginSetup = ReturnType<SecurityPlugin['setup']>;
export type SecurityPluginStart = ReturnType<SecurityPlugin['start']>;
