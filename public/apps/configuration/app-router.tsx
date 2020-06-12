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

import { EuiPage, EuiPageBody, EuiPageSideBar, EuiBreadcrumbs } from '@elastic/eui';
import React from 'react';
import { HashRouter as Router, Route, Switch } from 'react-router-dom';
import { partial } from 'lodash';
import { AppDependencies } from '../types';
import { AuthView } from './panels/auth-view/auth-view';
import { NavPanel } from './panels/nav-panel';
import { RoleEdit } from './panels/role-edit/role-edit';
import { RoleList } from './panels/role-list';
import { RoleView } from './panels/role-view/role-view';
import { UserList } from './panels/user-list';
import { RouteItem, ResourceType, Action } from './types';
import { buildUrl, buildHashUrl } from './utils/url-builder';
import { InternalUserEdit } from './panels/internal-user-edit/internal-user-edit';
import { AuditLogging } from './panels/audit-logging/audit-logging';

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

// url regex pattern for all pages with left nav panel, (/|/roles|/internalusers|...)
const PATTERNS_ROUTES_WITH_NAV_PANEL = '(' + ROUTE_LIST.map((route) => route.href).join('|') + ')';

function Breadcrumbs(resourceType: ResourceType, pageTitle: string) {
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
      ]}
    />
  );
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
              path={buildUrl(ResourceType.roles, Action.view, ':roleName')}
              render={(match) => (
                <RoleView
                  buildBreadcrumbs={partial(Breadcrumbs, ResourceType.roles)}
                  {...{ ...props, ...match.match.params }}
                />
              )}
            />
            <Route
              path={buildUrl(ResourceType.roles) + '/:action/:sourceRoleName'}
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
              path={buildUrl(ResourceType.users) + '/:action/:sourceUserName'}
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
            <Route path={ROUTE_MAP.auditLogging.href}>
              <AuditLogging {...props} />
            </Route>
          </Switch>
        </EuiPageBody>
      </EuiPage>
    </Router>
  );
}
