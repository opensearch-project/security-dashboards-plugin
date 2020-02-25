import { CoreSetup } from "../../../../../src/core/server";
import { SecurityPluginConfigType } from "../..";

export default class AuthType { // TODO maybe replace the logic here with AuthenticationHandler
  /*
  private const APP_ROOT: string;
  private const API_ROOT: string;
  private pluginRoot: string;
  private basePath: string;
  */
  private unauthenticatedRoutes: Array<string>;
  private routesToIgnore: Array<string>
  private sessionTTL: number;
  private sessionKeepAlive: boolean;
  private type: string;
  private validateAvailableTenantes: boolean = true;
  private authHeaderNaem: string = 'authorization';
  private allowedAdditionalAuthHeaders: Array<string> = ['security_impersonate_as'];

  constructor(private core: CoreSetup, private config: SecurityPluginConfigType) {
    this.routesToIgnore = [
      '/bundles/app/security-login/bootstrap.js',
      '/bundles/app/security-customerror/bootstrap.js'
    ];
    this.sessionTTL = this.config.session.ttl;
    this.sessionKeepAlive = this.config.session.keepalive;
    this.unauthenticatedRoutes = this.config.auth.unauthenticated_routes;
  }
  
  async init() {
    this.setupStorage();
  }

  private setupStorage = () => void {
    
  }
}