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

import { EuiPage, EuiPageBody, EuiPageSideBar } from '@elastic/eui';
import React from 'react';
import { HashRouter as Router, Route, Switch } from 'react-router-dom';
import { AppDependencies } from '../types';
import { AuthView } from './panels/auth-view/auth-view';
import { NavPanel } from './panels/nav-panel';
import { RoleEdit } from './panels/role-edit/role-edit';
import { RoleList } from './panels/role-list';
import { RoleView } from './panels/role-view/role-view';
import { UserList } from './panels/user-list';
import { RouteItem } from './types';

const ROUTE_MAP: { [key: string]: RouteItem } = {
  getStarted: {
    name: 'Get Started',
    href: '/',
  },
  roles: {
    name: 'Roles',
    href: '/roles',
  },
  users: {
    name: 'Users',
    href: '/internalusers',
  },
  permissions: {
    name: 'Permissions',
    href: '/permissions',
  },
  tenets: {
    name: 'Tenets',
    href: '/tenants',
  },
  auth: {
    name: 'Authentication and authorization',
    href: '/auth',
  },
};

const ROUTE_LIST = [
  ROUTE_MAP.getStarted,
  ROUTE_MAP.roles,
  ROUTE_MAP.users,
  ROUTE_MAP.permissions,
  ROUTE_MAP.tenets,
  ROUTE_MAP.auth,
];

const PATTERNS_ROUTES_WITH_NAV_PANEL = '(' + ROUTE_LIST.map((route) => route.href).join('|') + ')';

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
              path={`${ROUTE_MAP.roles.href}/:action/:sourceRoleName`}
              render={(match) => <RoleEdit {...{ ...props, ...match.match.params }} />}
            />
            <Route
              path={`${ROUTE_MAP.roles.href}/:roleName`}
              render={(match) => <RoleView {...{ ...props, ...match.match.params }} />}
            />
            <Route path={ROUTE_MAP.roles.href}>
              <RoleList {...props} />
            </Route>
            <Route path={ROUTE_MAP.auth.href}>
              <AuthView {...props} />
            </Route>
            <Route path={ROUTE_MAP.users.href}>
              <UserList {...props} />
            </Route>
          </Switch>
        </EuiPageBody>
      </EuiPage>
    </Router>
  );
}
