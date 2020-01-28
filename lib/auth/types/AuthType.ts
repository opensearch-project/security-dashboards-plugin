import { SecurityPluginConfigType } from 'src/plugins/security-kibana-plugin/server';

export default class AuthType {
  private const APP_ROOT: string;
  private const API_ROOT: string;
  private pluginRoot: string;
  private config: SecurityPluginConfigType;
  private basePath: string;
  private unauthenticatedRoutes: Array<string>;
}