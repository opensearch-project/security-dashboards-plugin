import { NavigationPublicPluginStart } from '../../../src/plugins/navigation/public';

export interface OpendistroSecurityPluginSetup {}
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface OpendistroSecurityPluginStart {}

export interface AppPluginStartDependencies {
  navigation: NavigationPublicPluginStart;
}
