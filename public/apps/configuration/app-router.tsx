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

import { EuiBreadcrumbs, EuiPage, EuiPageBody, EuiPageSideBar } from '@elastic/eui';
import React from 'react';
import { HashRouter as Router, Route, Switch } from 'react-router-dom';
import { partial } from 'lodash';
import { CoreStart } from 'kibana/public';
import { AppDependencies } from '../types';
import { AuthView } from './panels/auth-view/auth-view';
import { NavPanel } from './panels/nav-panel';
import { RoleEdit } from './panels/role-edit/role-edit';
import { RoleList } from './panels/role-list';
import { RoleView } from './panels/role-view/role-view';
import { UserList } from './panels/user-list';
import { Action, ResourceType, RouteItem, SubAction } from './types';
import { buildHashUrl, buildUrl } from './utils/url-builder';
import { InternalUserEdit } from './panels/internal-user-edit/internal-user-edit';
import { AuditLogging } from './panels/audit-logging/audit-logging';
import { AuditLoggingEditSettings } from './panels/audit-logging/audit-logging-edit-settings';
import {
  FROM_COMPLIANCE_SAVE_SUCCESS,
  FROM_GENERAL_SAVE_SUCCESS,
  SUB_URL_FOR_COMPLIANCE_SETTINGS_EDIT,
  SUB_URL_FOR_GENERAL_SETTINGS_EDIT,
} from './panels/audit-logging/constants';
import { PermissionList } from './panels/permission-list';
import { GetStarted } from './panels/get-started';

const ROUTE_MAP: { [key: string]: RouteItem } = {
  getStarted: {
    name: 'Get Started',
    href: buildUrl(),
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
  [ResourceType.auth]: {
    name: 'Authentication and authorization',
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
];

const allNavPanelUrls = ROUTE_LIST.map((route) => route.href).concat([
  buildUrl(ResourceType.auditLogging) + SUB_URL_FOR_GENERAL_SETTINGS_EDIT,
  buildUrl(ResourceType.auditLogging) + SUB_URL_FOR_COMPLIANCE_SETTINGS_EDIT,
  buildUrl(ResourceType.auditLogging) + FROM_GENERAL_SAVE_SUCCESS,
  buildUrl(ResourceType.auditLogging) + FROM_COMPLIANCE_SAVE_SUCCESS,
]);

// url regex pattern for all pages with left nav panel, (/|/roles|/internalusers|...)
const PATTERNS_ROUTES_WITH_NAV_PANEL = '(' + allNavPanelUrls.join('|') + ')';

// TODO: migrate to global Breadcrumbs.
function Breadcrumbs(resourceType: ResourceType, pageTitle: string, subAction?: string) {
  return (
    <EuiBreadcrumbs
      breadcrumbs={[
        {
          text: 'Security',
          href: buildHashUrl(),
        },
        {
          text: ROUTE_MAP[resourceType].name,
          href: buildHashUrl(resourceType),
        },
        {
          text: pageTitle,
        },
        {
          text: subAction,
        },
      ]}
    />
  );
}

export function setGlobalBreadcrumbs(
  coreStart: CoreStart,
  resourceType: ResourceType,
  pageTitle?: string
) {
  const breadcrumbs: Array<{ text: string; href?: string }> = [
    {
      text: 'Security',
      href: buildHashUrl(),
    },
    {
      text: ROUTE_MAP[resourceType].name,
      href: buildHashUrl(resourceType),
    },
  ];

  if (pageTitle) {
    breadcrumbs.push({
      text: pageTitle,
    });
  }

  coreStart.chrome.setBreadcrumbs(breadcrumbs);
}

export function AppRouter(props: AppDependencies) {
  return (
    <Router basename={props.params.appBasePath}>
      <EuiPage>
        <Route path={PATTERNS_ROUTES_WITH_NAV_PANEL} exact>
          <EuiPageSideBar>
            <NavPanel items={ROUTE_LIST} />
          </EuiPageSideBar>
        </Route>
        <EuiPageBody>
          <Switch>
            <Route
              path={buildUrl(ResourceType.roles, Action.view, ':roleName', SubAction.mapuser)}
              render={(match) => (
                <RoleView
                  buildBreadcrumbs={partial(Breadcrumbs, ResourceType.roles)}
                  {...{ ...props, ...match.match.params, subAction: 'mapuser' }}
                />
              )}
            />
            <Route
              path={buildUrl(ResourceType.roles, Action.view, ':roleName')}
              render={(match) => (
                <RoleView
                  buildBreadcrumbs={partial(Breadcrumbs, ResourceType.roles)}
                  {...{ ...props, ...match.match.params }}
                />
              )}
            />
            <Route
              path={buildUrl(ResourceType.roles) + '/:action/:sourceRoleName?'}
              render={(match) => (
                <RoleEdit
                  buildBreadcrumbs={partial(Breadcrumbs, ResourceType.roles)}
                  {...{ ...props, ...match.match.params }}
                />
              )}
            />
            <Route path={ROUTE_MAP.roles.href}>
              <RoleList {...props} />
            </Route>
            <Route path={ROUTE_MAP.auth.href}>
              <AuthView {...props} />
            </Route>
            <Route
              path={buildUrl(ResourceType.users) + '/:action/:sourceUserName?'}
              render={(match) => (
                <InternalUserEdit
                  buildBreadcrumbs={partial(Breadcrumbs, ResourceType.users)}
                  {...{ ...props, ...match.match.params }}
                />
              )}
            />
            <Route path={ROUTE_MAP.users.href}>
              <UserList {...props} />
            </Route>
            <Route
              path={buildUrl(ResourceType.auditLogging) + SUB_URL_FOR_GENERAL_SETTINGS_EDIT}
              render={() => {
                setGlobalBreadcrumbs(
                  props.coreStart,
                  ResourceType.auditLogging,
                  'General settings'
                );
                return <AuditLoggingEditSettings setting={'general'} {...props} />;
              }}
            />
            <Route
              path={buildUrl(ResourceType.auditLogging) + SUB_URL_FOR_COMPLIANCE_SETTINGS_EDIT}
              render={(match) => {
                setGlobalBreadcrumbs(
                  props.coreStart,
                  ResourceType.auditLogging,
                  'Compliance settings'
                );
                return <AuditLoggingEditSettings setting={'compliance'} {...props} />;
              }}
            />
            <Route
              path={ROUTE_MAP.auditLogging.href + '/:fromType?'}
              render={(match) => {
                setGlobalBreadcrumbs(props.coreStart, ResourceType.auditLogging);
                return <AuditLogging {...{ ...props, ...match.match.params }} />;
              }}
            />
            <Route path={ROUTE_MAP.permissions.href}>
              <PermissionList {...props} />
            </Route>
            <Route path={ROUTE_MAP.getStarted.href}>
              <GetStarted {...props} />
            </Route>
          </Switch>
        </EuiPageBody>
      </EuiPage>
    </Router>
  );
}
