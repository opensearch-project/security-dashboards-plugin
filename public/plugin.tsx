/*
 *   Copyright OpenSearch Contributors
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
  SavedObjectsManagementColumn,
  SavedObjectsManagementRecord,
} from 'src/plugins/saved_objects_management/public';
import { EuiTableFieldDataColumnType } from '@elastic/eui';
import { string } from 'joi';
import React from 'react';
import { i18n } from '@osd/i18n';
import {
  AppMountParameters,
  AppStatus,
  AppUpdater,
  CoreSetup,
  CoreStart,
  Plugin,
  PluginInitializerContext,
} from '../../../src/core/public';
import { APP_ID_LOGIN, CUSTOM_ERROR_PAGE_URI, LOGIN_PAGE_URI, PLUGIN_NAME } from '../common';
import { APP_ID_CUSTOMERROR } from '../common/index';
import { setupTopNavButton } from './apps/account/account-app';
import { fetchAccountInfoSafe } from './apps/account/utils';
import {
  API_ENDPOINT_PERMISSIONS_INFO,
  includeClusterPermissions,
  includeIndexPermissions,
} from './apps/configuration/constants';
import {
  excludeFromDisabledRestCategories,
  excludeFromDisabledTransportCategories,
} from './apps/configuration/panels/audit-logging/constants';
import {
  SecurityPluginStartDependencies,
  ClientConfigType,
  SecurityPluginSetup,
  SecurityPluginStart,
  SecurityPluginSetupDependencies,
} from './types';
import { addTenantToShareURL } from './services/shared-link';
import { interceptError } from './utils/logout-utils';

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
const APP_ID_HOME = 'home';
const APP_ID_DASHBOARDS = 'dashboards';
// OpenSearchDashboards app is for legacy url migration
const APP_ID_OPENSEARCH_DASHBOARDS = 'kibana';
const APP_LIST_FOR_READONLY_ROLE = [APP_ID_HOME, APP_ID_DASHBOARDS, APP_ID_OPENSEARCH_DASHBOARDS];
const GLOBAL_TENANT_RENDERING_TEXT = 'Global';
const PRIVATE_TENANT_RENDERING_TEXT = 'Private';
const GLOBAL_TENANT = '';
const PRIVATE_TENANT = '__user__';

export class SecurityPlugin
  implements
    Plugin<
      SecurityPluginSetup,
      SecurityPluginStart,
      SecurityPluginSetupDependencies,
      SecurityPluginStartDependencies
    > {
  // @ts-ignore : initializerContext not used
  constructor(private readonly initializerContext: PluginInitializerContext) {}

  public async setup(
    core: CoreSetup,
    deps: SecurityPluginSetupDependencies
  ): Promise<SecurityPluginSetup> {
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
        order: 8000,
        mount: async (params: AppMountParameters) => {
          const { renderApp } = await import('./apps/configuration/configuration-app');
          const [coreStart, depsStart] = await core.getStartServices();

          // merge OpenSearchDashboards yml configuration
          includeClusterPermissions(config.clusterPermissions.include);
          includeIndexPermissions(config.indexPermissions.include);

          excludeFromDisabledTransportCategories(config.disabledTransportCategories.exclude);
          excludeFromDisabledRestCategories(config.disabledRestCategories.exclude);

          return renderApp(coreStart, depsStart as SecurityPluginStartDependencies, params, config);
        },
        category: {
          id: 'opensearch',
          label: 'OpenSearch Plugins',
          order: 2000,
        },
      });
    }

    core.application.register({
      id: APP_ID_LOGIN,
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
      id: APP_ID_CUSTOMERROR,
      title: 'Security',
      chromeless: true,
      appRoute: CUSTOM_ERROR_PAGE_URI,
      mount: async (params: AppMountParameters) => {
        const { renderPage } = await import('./apps/customerror/custom-error');
        const [coreStart] = await core.getStartServices();
        return renderPage(coreStart, params, config);
      },
    });

    core.application.registerAppUpdater(
      new BehaviorSubject<AppUpdater>((app) => {
        if (!apiPermission && isReadonly && !APP_LIST_FOR_READONLY_ROLE.includes(app.id)) {
          return {
            status: AppStatus.inaccessible,
          };
        }
      })
    );

    if (config.multitenancy.enable_aggregation_view) {
      deps.savedObjectsManagement.columns.register(({
        id: 'tenant_column',
        euiColumn: {
          field: 'namespaces',
          name: <div>Tenant</div>,
          dataType: 'string',
          render: (value: any[][]) => {
            let text = value[0][0];
            if (isGlobalTenant(text)) {
              text = GLOBAL_TENANT_RENDERING_TEXT;
            } else if (isPrivateTenant(text)) {
              text = PRIVATE_TENANT_RENDERING_TEXT;
            }
            text = i18n.translate('savedObjectsManagement.objectsTable.table.columnTenantName', {
              defaultMessage: text,
            });
            return <div>{text}</div>;
          },
        },
        loadData: () => {},
      } as unknown) as SavedObjectsManagementColumn<string>);
    }

    // Return methods that should be available to other plugins
    return {};
  }

  public start(core: CoreStart, deps: SecurityPluginStartDependencies): SecurityPluginStart {
    const config = this.initializerContext.config.get<ClientConfigType>();

    setupTopNavButton(core, config);

    if (config.ui.autologout) {
      // logout the user when getting 401 unauthorized, e.g. when session timed out.
      core.http.intercept({
        responseError: interceptError(config.auth.logout_url, window),
      });
    }

    if (config.multitenancy.enabled) {
      addTenantToShareURL(core);
    }

    if (config.multitenancy.enable_aggregation_view) {
      const columns = deps.savedObjectsManagement.columns.getAll();
    }

    return {};
  }

  public stop() {}
}

function isPrivateTenant(selectedTenant: string) {
  return selectedTenant.startsWith('__user__');
}

function isGlobalTenant(selectedTenant: string) {
  return selectedTenant === null || selectedTenant === GLOBAL_TENANT;
}
