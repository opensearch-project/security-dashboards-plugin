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
import { SavedObjectsManagementColumn } from 'src/plugins/saved_objects_management/public';
import { i18n } from '@osd/i18n';
import {
  AppCategory,
  AppMountParameters,
  AppNavLinkStatus,
  AppStatus,
  AppUpdater,
  CoreSetup,
  CoreStart,
  DEFAULT_APP_CATEGORIES,
  DEFAULT_NAV_GROUPS,
  Plugin,
  PluginInitializerContext,
  WorkspaceAvailability,
} from '../../../src/core/public';
import {
  APP_ID_LOGIN,
  APP_ID_RESOURCE_ACCESS_MANAGEMENT,
  CUSTOM_ERROR_PAGE_URI,
  LOGIN_PAGE_URI,
  PLUGIN_AUDITLOG_APP_ID,
  PLUGIN_AUTH_APP_ID,
  PLUGIN_GET_STARTED_APP_ID,
  PLUGIN_NAME,
  PLUGIN_PERMISSIONS_APP_ID,
  PLUGIN_RESOURCE_ACCESS_MANAGEMENT_APP_ID,
  PLUGIN_ROLES_APP_ID,
  PLUGIN_TENANTS_APP_ID,
  PLUGIN_USERS_APP_ID,
} from '../common';
import { APP_ID_CUSTOMERROR } from '../common';
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
import { tenantColumn, getNamespacesToRegister } from './apps/configuration/utils/tenant-utils';
import { getDashboardsInfoSafe } from './utils/dashboards-info-utils';
import {
  dataSource$,
  getDataSourceEnabledUrl,
  getDataSourceFromUrl,
} from './utils/datasource-utils';

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

const dataAccessUsersCategory: AppCategory & { group?: AppCategory } = {
  id: 'dataAccessAndUsers',
  label: 'Data access and users',
  order: 9000,
  euiIconType: 'managementApp',
};

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

  private updateDefaultRouteOfSecurityApplications: AppUpdater = () => {
    const url = getDataSourceEnabledUrl(getDataSourceFromUrl());
    return {
      defaultPath: `?${url.searchParams.toString()}`,
    };
  };

  private appStateUpdater = new BehaviorSubject(this.updateDefaultRouteOfSecurityApplications);

  public async setup(
    core: CoreSetup,
    deps: SecurityPluginSetupDependencies
  ): Promise<SecurityPluginSetup> {
    const apiPermission = await hasApiPermission(core);
    const mdsEnabled = !!deps.dataSource?.dataSourceEnabled;

    const config = this.initializerContext.config.get<ClientConfigType>();

    const accountInfo = (await fetchAccountInfoSafe(core.http))?.data;
    const dashboardsInfo = await getDashboardsInfoSafe(core.http);
    const multitenancyEnabled = dashboardsInfo?.multitenancy_enabled;
    const resourceSharingEnabled = dashboardsInfo?.resource_sharing_enabled;
    const isReadonly = accountInfo?.roles.some((role) =>
      (config.readonly_mode?.roles || DEFAULT_READONLY_ROLES).includes(role)
    );

    const mountWrapper = async (params: AppMountParameters, redirect: string) => {
      const { renderApp } = await import('./apps/configuration/configuration-app');
      const [coreStart, depsStart] = await core.getStartServices();

      // merge OpenSearchDashboards yml configuration
      includeClusterPermissions(config.clusterPermissions.include);
      includeIndexPermissions(config.indexPermissions.include);

      excludeFromDisabledTransportCategories(config.disabledTransportCategories.exclude);
      excludeFromDisabledRestCategories(config.disabledRestCategories.exclude);

      return renderApp(
        coreStart,
        depsStart as SecurityPluginStartDependencies,
        params,
        config,
        redirect,
        deps.dataSourceManagement
      );
    };

    if (mdsEnabled || apiPermission) {
      core.application.register({
        id: PLUGIN_NAME,
        title: 'Security',
        order: 9050,
        workspaceAvailability: WorkspaceAvailability.outsideWorkspace,
        navLinkStatus: core.chrome.navGroup.getNavGroupEnabled()
          ? AppNavLinkStatus.hidden
          : AppNavLinkStatus.visible,
        mount: async (params: AppMountParameters) => {
          const { renderApp } = await import('./apps/configuration/configuration-app');
          const [coreStart, depsStart] = await core.getStartServices();

          // merge OpenSearchDashboards yml configuration
          includeClusterPermissions(config.clusterPermissions.include);
          includeIndexPermissions(config.indexPermissions.include);

          excludeFromDisabledTransportCategories(config.disabledTransportCategories.exclude);
          excludeFromDisabledRestCategories(config.disabledRestCategories.exclude);

          return renderApp(
            coreStart,
            depsStart as SecurityPluginStartDependencies,
            params,
            config,
            '/getstarted',
            deps.dataSourceManagement
          );
        },
        category: DEFAULT_APP_CATEGORIES.management,
      });

      if (core.chrome.navGroup.getNavGroupEnabled()) {
        core.application.register({
          id: PLUGIN_GET_STARTED_APP_ID,
          title: 'Get started with access control',
          order: 8040,
          workspaceAvailability: WorkspaceAvailability.outsideWorkspace,
          updater$: this.appStateUpdater,
          mount: async (params: AppMountParameters) => {
            return mountWrapper(params, '/getstarted');
          },
        });
        core.application.register({
          id: PLUGIN_AUTH_APP_ID,
          title: 'Authentication and authorization',
          order: 8040,
          description: i18n.translate('security.authenticationAndAuthorization.description', {
            defaultMessage: 'Set up authentication and authorization sequences.',
          }),
          workspaceAvailability: WorkspaceAvailability.outsideWorkspace,
          updater$: this.appStateUpdater,
          mount: async (params: AppMountParameters) => {
            return mountWrapper(params, '/auth');
          },
        });
        core.application.register({
          id: PLUGIN_ROLES_APP_ID,
          title: 'Roles',
          order: 8040,
          description: i18n.translate('security.roles.description', {
            defaultMessage: 'Create a set of permissions with specific privileges.',
          }),
          workspaceAvailability: WorkspaceAvailability.outsideWorkspace,
          updater$: this.appStateUpdater,
          mount: async (params: AppMountParameters) => {
            return mountWrapper(params, '/roles');
          },
        });
        core.application.register({
          id: PLUGIN_USERS_APP_ID,
          title: 'Internal users',
          order: 8040,
          description: i18n.translate('security.internalUsers.description', {
            defaultMessage: 'Define users to control access to your data.',
          }),
          workspaceAvailability: WorkspaceAvailability.outsideWorkspace,
          updater$: this.appStateUpdater,
          mount: async (params: AppMountParameters) => {
            return mountWrapper(params, '/users');
          },
        });
        core.application.register({
          id: PLUGIN_PERMISSIONS_APP_ID,
          title: 'Permissions',
          order: 8040,
          description: i18n.translate('security.permissions.description', {
            defaultMessage: 'Controls access to individual actions and action groups.',
          }),
          workspaceAvailability: WorkspaceAvailability.outsideWorkspace,
          updater$: this.appStateUpdater,
          mount: async (params: AppMountParameters) => {
            return mountWrapper(params, '/permissions');
          },
        });
        if (config.multitenancy.enabled) {
          core.application.register({
            id: PLUGIN_TENANTS_APP_ID,
            title: 'Tenants',
            order: 8040,
            workspaceAvailability: WorkspaceAvailability.outsideWorkspace,
            updater$: this.appStateUpdater,
            mount: async (params: AppMountParameters) => {
              return mountWrapper(params, '/tenants');
            },
          });
        }
        core.application.register({
          id: PLUGIN_AUDITLOG_APP_ID,
          title: 'Audit logs',
          order: 8040,
          description: i18n.translate('security.auditLogs.description', {
            defaultMessage: 'Configure audit logging for system access activities.',
          }),
          workspaceAvailability: WorkspaceAvailability.outsideWorkspace,
          updater$: this.appStateUpdater,
          mount: async (params: AppMountParameters) => {
            return mountWrapper(params, '/auditLogging');
          },
        });

        // Register Resource Access Management app only if resource sharing is enabled
        if (resourceSharingEnabled) {
          core.application.register({
            id: PLUGIN_RESOURCE_ACCESS_MANAGEMENT_APP_ID,
            title: 'Resource Access Management',
            order: 8040,
            description: i18n.translate('security.resourceAccessManagement.description', {
              defaultMessage:
                'Share and manage access to individual resources (detectors, forecasters, etc.).',
            }),
            workspaceAvailability: WorkspaceAvailability.outsideWorkspace,
            updater$: this.appStateUpdater,
            // Reuse your existing wrapper so default route/query handling is consistent:
            mount: async (params: AppMountParameters) => {
              return mountWrapper(params, '/resource-access-management');
            },
          });
        }
      }

      core.chrome.navGroup.addNavLinksToGroup(DEFAULT_NAV_GROUPS.dataAdministration, [
        {
          id: PLUGIN_GET_STARTED_APP_ID,
          category: dataAccessUsersCategory,
          order: 100,
        },
        {
          id: PLUGIN_AUTH_APP_ID,
          category: dataAccessUsersCategory,
          order: 200,
        },
        {
          id: PLUGIN_ROLES_APP_ID,
          category: dataAccessUsersCategory,
          order: 500,
        },
        {
          id: PLUGIN_USERS_APP_ID,
          category: dataAccessUsersCategory,
          order: 300,
        },
        {
          id: PLUGIN_PERMISSIONS_APP_ID,
          category: dataAccessUsersCategory,
          order: 400,
        },
        {
          id: PLUGIN_TENANTS_APP_ID,
          category: dataAccessUsersCategory,
          order: 700,
        },
        {
          id: PLUGIN_AUDITLOG_APP_ID,
          category: dataAccessUsersCategory,
          order: 600,
        },
        ...(resourceSharingEnabled
          ? [
              {
                id: PLUGIN_RESOURCE_ACCESS_MANAGEMENT_APP_ID,
                category: dataAccessUsersCategory,
                order: 800,
              },
            ]
          : []),
      ]);

      if (deps.managementOverview) {
        deps.managementOverview.register({
          id: PLUGIN_NAME,
          title: 'Security',
          order: 9050,
          description: i18n.translate('security.securityDescription', {
            defaultMessage:
              'Configure how users access data in OpenSearch with authentication, access control and audit logging.',
          }),
        });
      }

      dataSource$.subscribe((dataSourceOption) => {
        if (dataSourceOption) {
          this.appStateUpdater.next(this.updateDefaultRouteOfSecurityApplications);
        }
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
        return renderApp(coreStart, params, config);
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

    if (resourceSharingEnabled) {
      core.application.register({
        id: APP_ID_RESOURCE_ACCESS_MANAGEMENT,
        title: 'Resource Access Management',
        order: 8045,
        workspaceAvailability: WorkspaceAvailability.outsideWorkspace,
        // If nav groups are enabled, hide the legacy nav link (we’ll add it via navGroup below);
        // otherwise, make the classic left-nav link visible.
        navLinkStatus: core.chrome.navGroup.getNavGroupEnabled()
          ? AppNavLinkStatus.hidden
          : AppNavLinkStatus.visible,
        category: DEFAULT_APP_CATEGORIES.management, // classic left-nav placement
        // updater$ is optional; include if you use defaultPath updates like the others
        updater$: this.appStateUpdater,
        // IMPORTANT: do NOT set chromeless: true (that hides the left nav)
        mount: async (params: AppMountParameters) => {
          const { renderApp } = await import(
            './apps/resource-sharing/resource-access-management-app'
          );
          const [coreStart, depsStart] = await core.getStartServices();
          return renderApp(
            coreStart,
            depsStart as SecurityPluginStartDependencies,
            params,
            config,
            '/resource-access-management',
            deps.dataSourceManagement
          );
        },
      });
    }

    core.application.registerAppUpdater(
      new BehaviorSubject<AppUpdater>((app) => {
        if (!apiPermission && isReadonly && !APP_LIST_FOR_READONLY_ROLE.includes(app.id)) {
          return {
            status: AppStatus.inaccessible,
          };
        }
      })
    );

    if (
      multitenancyEnabled &&
      config.multitenancy.enabled &&
      config.multitenancy.enable_aggregation_view
    ) {
      deps.savedObjectsManagement.columns.register(
        (tenantColumn as unknown) as SavedObjectsManagementColumn<string>
      );
      if (!!accountInfo) {
        const namespacesToRegister = getNamespacesToRegister(accountInfo);
        deps.savedObjectsManagement.namespaces.registerAlias('Tenant');
        namespacesToRegister.forEach((ns) => {
          deps.savedObjectsManagement.namespaces.register(ns as SavedObjectsManagementNamespace);
        });
      }
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
    return {};
  }

  public stop() {}
}
