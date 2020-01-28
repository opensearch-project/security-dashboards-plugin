import { map } from 'rxjs/operators';
import {
  CoreSetup,
  CoreStart,
  Logger,
  PluginInitializerContext,
  PluginName,
} from 'kibana/server';
import { SecurityPluginConfigType } from './';

export default class SecurityPlugin {
  private readonly log: Logger;

  constructor(private readonly initializerContext: PluginInitializerContext) {
    this.log = this.initializerContext.logger.get();
  }

  public setup(core: CoreSetup, deps: Record<PluginName, unknown>) {
    const config$ = this.initializerContext.config.create<SecurityPluginConfigType>();

    const router = core.http.createRouter();
    router.get(
      { path: '/test/authenticate', validate: false },
      async (context, req, res) => {
        const response = await context.core.elasticsearch.adminClient.callAsInternalUser('ping');
        return res.ok({ body: `Elasticsearch: ${response}` });
      }
    );

    return {
      config$,
    };
  }

  public start(core: CoreStart, deps: Record<PluginName, unknown>) {
    this.log.debug(`Starting security plugin`);
  }

  public stop() {
    this.log.debug(`Stopping security plugin`);
  }
}
