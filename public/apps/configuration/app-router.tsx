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

const RoutesMap: { [key: string]: RouteItem } = {
  getStarted: {
    name: 'Get Started',
    href: '/getstarted',
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

const RoutesList = [
  RoutesMap.getStarted,
  RoutesMap.roles,
  RoutesMap.users,
  RoutesMap.permissions,
  RoutesMap.tenets,
  RoutesMap.auth,
];

export function AppRouter(props: AppDependencies) {
  return (
    <Router basename={props.params.appBasePath}>
      <EuiPage>
        <Route path={`(${RoutesList.map((r) => r.href).join('|')}|/)`} exact>
          <EuiPageSideBar>
            <NavPanel items={RoutesList} />
          </EuiPageSideBar>
        </Route>
        <EuiPageBody>
          <Switch>
            <Route
              path={`${RoutesMap.roles.href}/:action/:sourceRoleName`}
              render={(match) => <RoleEdit {...{ ...props, ...match.match.params }} />}
            />
            <Route
              path={`${RoutesMap.roles.href}/:roleName`}
              render={(match) => <RoleView {...{ ...props, ...match.match.params }} />}
            />
            <Route path={RoutesMap.roles.href}>
              <RoleList {...props} />
            </Route>
            <Route path={RoutesMap.auth.href}>
              <AuthView {...props} />
            </Route>
            <Route path={RoutesMap.users.href}>
              <UserList {...props} />
            </Route>
          </Switch>
        </EuiPageBody>
      </EuiPage>
    </Router>
  );
}
