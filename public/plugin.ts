/*
 *   Copyright 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *
 *   Licensed under the Apache License, Version 2.0 (the "License").
 *   You may not use this file except in compliance with the License.
 *   A copy of the License is located at
 *
 *       http://www.apache.org/licenses/LICENSE-2.0
 *
 *   or in the "license" file accompanying this file. This file is distributed
 *   on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either
 *   express or implied. See the License for the specific language governing
 *   permissions and limitations under the License.
 */

import { BehaviorSubject } from 'rxjs';
import {
  AppMountParameters,
  CoreSetup,
  CoreStart,
  Plugin,
  PluginInitializerContext,
  AppUpdater,
  AppStatus,
  DEFAULT_APP_CATEGORIES,
} from '../../../src/core/public';
import {
  OpendistroSecurityPluginSetup,
  OpendistroSecurityPluginStart,
  AppPluginStartDependencies,
  ClientConfigType,
} from './types';
import { LOGIN_PAGE_URI, PLUGIN_NAME, SELECT_TENANT_PAGE_URI } from '../common';
import {
  API_ENDPOINT_PERMISSIONS_INFO,
  includeClusterPermissions,
  includeIndexPermissions,
} from './apps/configuration/constants';
import { setupTopNavButton } from './apps/account/account-app';
import { fetchAccountInfoSafe } from './apps/account/utils';
import {
  excludeFromDisabledRestCategories,
  excludeFromDisabledTransportCategories,
} from './apps/configuration/panels/audit-logging/constants';

async function hasApiPermission(core: CoreSetup): Promise<boolean | undefined> {
  try {
    const permissions = await core.http.get(API_ENDPOINT_PERMISSIONS_INFO);
    return permissions.has_api_access || false;
  } catch (e) {
    console.error(e);
    // ignore exceptions and default to no security related access.
    return false;
  }
}

const DEFAULT_READONLY_ROLES = ['kibana_read_only'];

export class OpendistroSecurityPlugin
  implements Plugin<OpendistroSecurityPluginSetup, OpendistroSecurityPluginStart> {
  // @ts-ignore : initializerContext not used
  constructor(private readonly initializerContext: PluginInitializerContext) {}

  public async setup(core: CoreSetup): Promise<OpendistroSecurityPluginSetup> {
    const apiPermission = await hasApiPermission(core);

    const config = this.initializerContext.config.get<ClientConfigType>();

    const accountInfo = (await fetchAccountInfoSafe(core.http))?.data;
    const isReadonly = accountInfo?.roles.some((role) =>
      (config.readonly_mode?.roles || DEFAULT_READONLY_ROLES).includes(role)
    );

    if (apiPermission) {
      core.application.register({
        id: PLUGIN_NAME,
        title: 'Security',
        order: 9040,
        mount: async (params: AppMountParameters) => {
          const { renderApp } = await import('./apps/configuration/configuration-app');
          const [coreStart, depsStart] = await core.getStartServices();

          // merge Kibana yml configuration
          includeClusterPermissions(config.clusterPermissions.include);
          includeIndexPermissions(config.indexPermissions.include);

          excludeFromDisabledTransportCategories(config.disabledTransportCategories.exclude);
          excludeFromDisabledRestCategories(config.disabledRestCategories.exclude);

          return renderApp(coreStart, depsStart as AppPluginStartDependencies, params, config);
        },
        category: DEFAULT_APP_CATEGORIES.management,
      });
    }

    core.application.register({
      id: 'login',
      title: 'Security',
      chromeless: true,
      appRoute: LOGIN_PAGE_URI,
      mount: async (params: AppMountParameters) => {
        const { renderApp } = await import('./apps/login/login-app');
        // @ts-ignore depsStart not used.
        const [coreStart, depsStart] = await core.getStartServices();
        return renderApp(coreStart, params, config.ui.basicauth.login);
      },
    });

    core.application.register({
      id: 'multitenancy',
      title: 'Security',
      chromeless: true,
      appRoute: SELECT_TENANT_PAGE_URI,
      mount: async (params: AppMountParameters) => {
        const { renderPage } = await import('./apps/account/tenant-selection-page');
        const [coreStart] = await core.getStartServices();
        return renderPage(coreStart, params, config, apiPermission);
      },
    });

    core.application.registerAppUpdater(
      new BehaviorSubject<AppUpdater>((app) => {
        if (!apiPermission && isReadonly && app.id !== 'dashboards' && app.id !== 'home') {
          return {
            status: AppStatus.inaccessible,
          };
        }
      })
    );

    // Return methods that should be available to other plugins
    return {};
  }

  public start(core: CoreStart): OpendistroSecurityPluginStart {
    const config = this.initializerContext.config.get<ClientConfigType>();

    setupTopNavButton(core, config);

    return {};
  }

  public stop() {}
}
