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

import { EuiPage, EuiPageBody, EuiPageSideBar } from '@elastic/eui';
import { flow } from 'lodash';
import React, { createContext, useState } from 'react';
import { HashRouter as Router, Route, Switch, Redirect } from 'react-router-dom';
import { DataSourceOption } from 'src/plugins/data_source_management/public/components/data_source_menu/types';
import { AppDependencies } from '../types';
import { AuditLogging } from './panels/audit-logging/audit-logging';
import { AuditLoggingEditSettings } from './panels/audit-logging/audit-logging-edit-settings';
import {
  SUB_URL_FOR_COMPLIANCE_SETTINGS_EDIT,
  SUB_URL_FOR_GENERAL_SETTINGS_EDIT,
} from './panels/audit-logging/constants';
import { AuthView } from './panels/auth-view/auth-view';
import { GetStarted } from './panels/get-started';
import { InternalUserEdit } from './panels/internal-user-edit/internal-user-edit';
import { NavPanel } from './panels/nav-panel';
import { PermissionList } from './panels/permission-list/permission-list';
import { RoleEdit } from './panels/role-edit/role-edit';
import { RoleList } from './panels/role-list';
import { RoleEditMappedUser } from './panels/role-mapping/role-edit-mapped-user';
import { RoleView } from './panels/role-view/role-view';
import { TenantList } from './panels/tenant-list/tenant-list';
import { UserList } from './panels/user-list';
import { Action, RouteItem, SubAction } from './types';
import { ResourceType } from '../../../common';
import { buildUrl } from './utils/url-builder';
import { CrossPageToast } from './cross-page-toast';
import { getDataSourceFromUrl, LocalCluster } from '../../utils/datasource-utils';
import { getBreadcrumbs } from './utils/resource-utils';

const LANDING_PAGE_URL = '/getstarted';

export const ROUTE_MAP: { [key: string]: RouteItem } = {
  getStarted: {
    name: 'Get Started',
    breadCrumbDisplayNameWithoutSecurityBase: 'Get started with access control',
    href: LANDING_PAGE_URL,
  },
  [ResourceType.roles]: {
    name: 'Roles',
    breadCrumbDisplayNameWithoutSecurityBase: 'Roles',
    href: buildUrl(ResourceType.roles),
  },
  [ResourceType.users]: {
    name: 'Internal users',
    breadCrumbDisplayNameWithoutSecurityBase: 'Internal users',
    href: buildUrl(ResourceType.users),
  },
  [ResourceType.permissions]: {
    name: 'Permissions',
    breadCrumbDisplayNameWithoutSecurityBase: 'Permissions',
    href: buildUrl(ResourceType.permissions),
  },
  [ResourceType.tenants]: {
    name: 'Tenants',
    breadCrumbDisplayNameWithoutSecurityBase: 'Dashboard multi-tenancy',
    href: buildUrl(ResourceType.tenants),
  },
  [ResourceType.tenantsConfigureTab]: {
    name: '',
    href: buildUrl(ResourceType.tenantsConfigureTab),
  },
  [ResourceType.auth]: {
    name: 'Authentication',
    breadCrumbDisplayNameWithoutSecurityBase: 'Authentication and authorization',
    href: buildUrl(ResourceType.auth),
  },
  [ResourceType.auditLogging]: {
    name: 'Audit logs',
    breadCrumbDisplayNameWithoutSecurityBase: 'Audit logs',
    href: buildUrl(ResourceType.auditLogging),
  },
};

const getRouteList = (multitenancyEnabled: boolean) => {
  return [
    ROUTE_MAP.getStarted,
    ROUTE_MAP[ResourceType.auth],
    ROUTE_MAP[ResourceType.roles],
    ROUTE_MAP[ResourceType.users],
    ROUTE_MAP[ResourceType.permissions],
    ...(multitenancyEnabled ? [ROUTE_MAP[ResourceType.tenants]] : []),
    ROUTE_MAP[ResourceType.auditLogging],
  ];
};

export const allNavPanelUrls = (multitenancyEnabled: boolean) =>
  getRouteList(multitenancyEnabled)
    .map((route) => route.href)
    .concat([
      buildUrl(ResourceType.auditLogging) + SUB_URL_FOR_GENERAL_SETTINGS_EDIT,
      buildUrl(ResourceType.auditLogging) + SUB_URL_FOR_COMPLIANCE_SETTINGS_EDIT,
      ...(multitenancyEnabled ? [buildUrl(ResourceType.tenantsConfigureTab)] : []),
    ]);

function decodeParams(params: { [k: string]: string | undefined }): any {
  return Object.keys(params).reduce((obj: { [k: string]: string | undefined }, key: string) => {
    const value = params[key];
    obj[key] = value !== undefined ? decodeURIComponent(value) : undefined;
    return obj;
  }, {});
}

export interface DataSourceContextType {
  dataSource: DataSourceOption;
  setDataSource: React.Dispatch<React.SetStateAction<DataSourceOption>>;
}

export const DataSourceContext = createContext<DataSourceContextType | null>(null);

export function AppRouter(props: AppDependencies) {
  const multitenancyEnabled = props.config.multitenancy.enabled;
  const dataSourceEnabled = !!props.depsStart.dataSource?.dataSourceEnabled;
  const setGlobalBreadcrumbs = flow(getBreadcrumbs, props.coreStart.chrome.setBreadcrumbs);
  const dataSourceFromUrl = dataSourceEnabled ? getDataSourceFromUrl() : LocalCluster;

  const [dataSource, setDataSource] = useState<DataSourceOption>(dataSourceFromUrl);
  const includeSecurityBase = !props.coreStart.uiSettings.get('home:useNewHomePage');

  return (
    <DataSourceContext.Provider value={{ dataSource, setDataSource }}>
      <Router>
        <EuiPage>
          {!props.coreStart.chrome.navGroup.getNavGroupEnabled() &&
            allNavPanelUrls(multitenancyEnabled).map((route) => (
              // Create different routes to update the 'selected' nav item .
              <Route key={route} path={route} exact>
                <EuiPageSideBar>
                  <NavPanel items={getRouteList(multitenancyEnabled)} />
                </EuiPageSideBar>
              </Route>
            ))}
          <EuiPageBody>
            <Switch>
              <Route
                path={buildUrl(ResourceType.roles, Action.edit) + '/:roleName/' + SubAction.mapuser}
                render={(match) => (
                  <RoleEditMappedUser {...{ ...props, ...decodeParams(match.match.params) }} />
                )}
              />
              <Route
                path={buildUrl(ResourceType.roles, Action.view) + '/:roleName/:prevAction?'}
                render={(match) => (
                  <RoleView {...{ ...props, ...decodeParams(match.match.params) }} />
                )}
              />
              <Route
                path={buildUrl(ResourceType.roles) + '/:action/:sourceRoleName?'}
                render={(match) => (
                  <RoleEdit {...{ ...props, ...decodeParams(match.match.params) }} />
                )}
              />
              <Route
                path={ROUTE_MAP.roles.href}
                render={() => {
                  return <RoleList {...props} />;
                }}
              />
              <Route
                path={ROUTE_MAP.auth.href}
                render={() => {
                  return <AuthView {...props} />;
                }}
              />
              <Route
                path={buildUrl(ResourceType.users) + '/:action/:sourceUserName?'}
                render={(match) => (
                  <InternalUserEdit {...{ ...props, ...decodeParams(match.match.params) }} />
                )}
              />
              <Route
                path={ROUTE_MAP.users.href}
                render={() => {
                  return <UserList {...props} />;
                }}
              />
              <Route
                path={buildUrl(ResourceType.auditLogging) + SUB_URL_FOR_GENERAL_SETTINGS_EDIT}
                render={() => {
                  return <AuditLoggingEditSettings setting={'general'} {...props} />;
                }}
              />
              <Route
                path={buildUrl(ResourceType.auditLogging) + SUB_URL_FOR_COMPLIANCE_SETTINGS_EDIT}
                render={() => {
                  return <AuditLoggingEditSettings setting={'compliance'} {...props} />;
                }}
              />
              <Route
                path={ROUTE_MAP.auditLogging.href + '/:fromType?'}
                render={(match) => {
                  return <AuditLogging {...{ ...props, ...match.match.params }} />;
                }}
              />
              <Route
                path={ROUTE_MAP.permissions.href}
                render={() => {
                  return <PermissionList {...props} />;
                }}
              />
              <Route
                path={ROUTE_MAP.getStarted.href}
                render={() => {
                  return <GetStarted {...props} />;
                }}
              />
              {multitenancyEnabled && (
                <Route
                  path={ROUTE_MAP.tenants.href}
                  render={() => {
                    return <TenantList tabID={'Manage'} {...props} />;
                  }}
                />
              )}
              {multitenancyEnabled && (
                <Route
                  path={ROUTE_MAP.tenantsConfigureTab.href}
                  render={() => {
                    return <TenantList tabID={'Configure'} {...props} />;
                  }}
                />
              )}
              <Redirect exact from="/" to={props.redirect} />
            </Switch>
          </EuiPageBody>
          <CrossPageToast />
        </EuiPage>
      </Router>
    </DataSourceContext.Provider>
  );
}
