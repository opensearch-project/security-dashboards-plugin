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

import { EuiBreadcrumb, EuiPage, EuiPageBody, EuiPageSideBar } from '@elastic/eui';
import { flow, map, mapValues, partial } from 'lodash';
import React from 'react';
import { HashRouter as Router, Route, Switch, Redirect } from 'react-router-dom';
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
import { Action, ResourceType, RouteItem, SubAction } from './types';
import { buildHashUrl, buildUrl } from './utils/url-builder';
import { CrossPageToast } from './cross-page-toast';

const LANDING_PAGE_URL = '/getstarted';

const ROUTE_MAP: { [key: string]: RouteItem } = {
  getStarted: {
    name: 'Get Started',
    href: LANDING_PAGE_URL,
  },
  [ResourceType.roles]: {
    name: 'Roles',
    href: buildUrl(ResourceType.roles),
  },
  [ResourceType.users]: {
    name: 'Internal users',
    href: buildUrl(ResourceType.users),
  },
  [ResourceType.permissions]: {
    name: 'Permissions',
    href: buildUrl(ResourceType.permissions),
  },
  [ResourceType.tenants]: {
    name: 'Tenants',
    href: buildUrl(ResourceType.tenants),
  },
  [ResourceType.tenantsManageTab]: {
    name: 'TenantsManageTab',
    href: buildUrl(ResourceType.tenantsManageTab),
  },
  [ResourceType.tenantsConfigureTab]: {
    name: '',
    href: buildUrl(ResourceType.tenantsConfigureTab),
  },
  [ResourceType.auth]: {
    name: 'Authentication',
    href: buildUrl(ResourceType.auth),
  },
  [ResourceType.auditLogging]: {
    name: 'Audit logs',
    href: buildUrl(ResourceType.auditLogging),
  },
};

const ROUTE_LIST = [
  ROUTE_MAP.getStarted,
  ROUTE_MAP[ResourceType.auth],
  ROUTE_MAP[ResourceType.roles],
  ROUTE_MAP[ResourceType.users],
  ROUTE_MAP[ResourceType.permissions],
  ROUTE_MAP[ResourceType.tenants],
  ROUTE_MAP[ResourceType.auditLogging],
  ROUTE_MAP[ResourceType.tenantsConfigureTab],
];

const allNavPanelUrls = ROUTE_LIST.map((route) => route.href).concat([
  buildUrl(ResourceType.auditLogging) + SUB_URL_FOR_GENERAL_SETTINGS_EDIT,
  buildUrl(ResourceType.auditLogging) + SUB_URL_FOR_COMPLIANCE_SETTINGS_EDIT,
]);

export function getBreadcrumbs(
  resourceType?: ResourceType,
  pageTitle?: string,
  subAction?: string
): EuiBreadcrumb[] {
  const breadcrumbs: EuiBreadcrumb[] = [
    {
      text: 'Security',
      href: buildHashUrl(),
    },
  ];

  if (resourceType) {
    breadcrumbs.push({
      text: ROUTE_MAP[resourceType].name,
      href: buildHashUrl(resourceType),
    });
  }

  if (pageTitle) {
    breadcrumbs.push({
      text: pageTitle,
    });
  }

  if (subAction) {
    breadcrumbs.push({
      text: subAction,
    });
  }
  return breadcrumbs;
}

function decodeParams(params: { [k: string]: string }): any {
  return Object.keys(params).reduce((obj: { [k: string]: string }, key: string) => {
    obj[key] = decodeURIComponent(params[key]);
    return obj;
  }, {});
}

export function AppRouter(props: AppDependencies) {
  const setGlobalBreadcrumbs = flow(getBreadcrumbs, props.coreStart.chrome.setBreadcrumbs);

  return (
    <Router basename={props.params.appBasePath}>
      <EuiPage>
        {allNavPanelUrls.map((route) => (
          // Create different routes to update the 'selected' nav item .
          <Route key={route} path={route} exact>
            <EuiPageSideBar>
              <NavPanel items={ROUTE_LIST} />
            </EuiPageSideBar>
          </Route>
        ))}
        <EuiPageBody>
          <Switch>
            <Route
              path={buildUrl(ResourceType.roles, Action.edit) + '/:roleName/' + SubAction.mapuser}
              render={(match) => (
                <RoleEditMappedUser
                  buildBreadcrumbs={partial(setGlobalBreadcrumbs, ResourceType.roles)}
                  {...{ ...props, ...decodeParams(match.match.params) }}
                />
              )}
            />
            <Route
              path={buildUrl(ResourceType.roles, Action.view) + '/:roleName/:prevAction?'}
              render={(match) => (
                <RoleView
                  buildBreadcrumbs={partial(setGlobalBreadcrumbs, ResourceType.roles)}
                  {...{ ...props, ...decodeParams(match.match.params) }}
                />
              )}
            />
            <Route
              path={buildUrl(ResourceType.roles) + '/:action/:sourceRoleName?'}
              render={(match) => (
                <RoleEdit
                  buildBreadcrumbs={partial(setGlobalBreadcrumbs, ResourceType.roles)}
                  {...{ ...props, ...decodeParams(match.match.params) }}
                />
              )}
            />
            <Route
              path={ROUTE_MAP.roles.href}
              render={() => {
                setGlobalBreadcrumbs(ResourceType.roles);
                return <RoleList {...props} />;
              }}
            />
            <Route
              path={ROUTE_MAP.auth.href}
              render={() => {
                setGlobalBreadcrumbs(ResourceType.auth);
                return <AuthView {...props} />;
              }}
            />
            <Route
              path={buildUrl(ResourceType.users) + '/:action/:sourceUserName?'}
              render={(match) => (
                <InternalUserEdit
                  buildBreadcrumbs={partial(setGlobalBreadcrumbs, ResourceType.users)}
                  {...{ ...props, ...decodeParams(match.match.params) }}
                />
              )}
            />
            <Route
              path={ROUTE_MAP.users.href}
              render={() => {
                setGlobalBreadcrumbs(ResourceType.users);
                return <UserList {...props} />;
              }}
            />
            <Route
              path={buildUrl(ResourceType.auditLogging) + SUB_URL_FOR_GENERAL_SETTINGS_EDIT}
              render={() => {
                setGlobalBreadcrumbs(ResourceType.auditLogging, 'General settings');
                return <AuditLoggingEditSettings setting={'general'} {...props} />;
              }}
            />
            <Route
              path={buildUrl(ResourceType.auditLogging) + SUB_URL_FOR_COMPLIANCE_SETTINGS_EDIT}
              render={() => {
                setGlobalBreadcrumbs(ResourceType.auditLogging, 'Compliance settings');
                return <AuditLoggingEditSettings setting={'compliance'} {...props} />;
              }}
            />
            <Route
              path={ROUTE_MAP.auditLogging.href + '/:fromType?'}
              render={(match) => {
                setGlobalBreadcrumbs(ResourceType.auditLogging);
                return <AuditLogging {...{ ...props, ...match.match.params }} />;
              }}
            />
            <Route
              path={ROUTE_MAP.permissions.href}
              render={() => {
                setGlobalBreadcrumbs(ResourceType.permissions);
                return <PermissionList {...props} />;
              }}
            />
            <Route
              path={ROUTE_MAP.tenants.href}
              render={() => {
                setGlobalBreadcrumbs(ResourceType.tenants);
                return <TenantList tabID={'Manage'} {...props} />;
              }}
            />
            <Route
              path={ROUTE_MAP.tenantsConfigureTab.href}
              render={() => {
                setGlobalBreadcrumbs(ResourceType.tenants);
                return <TenantList tabID={'Configure'} {...props} />;
              }}
            />
            <Route
              path={ROUTE_MAP.getStarted.href}
              render={() => {
                setGlobalBreadcrumbs();
                return <GetStarted {...props} />;
              }}
            />
            <Redirect exact from="/" to={LANDING_PAGE_URL} />
          </Switch>
        </EuiPageBody>
        <CrossPageToast />
      </EuiPage>
    </Router>
  );
}
