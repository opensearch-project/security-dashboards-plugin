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

import React, { Fragment } from 'react';

import {
  EuiBreadcrumbs,
  EuiButton,
  EuiPageContentHeader,
  EuiPageContentHeaderSection,
  EuiSpacer,
  EuiTabbedContent,
  EuiTitle,
} from '@elastic/eui';
import { AppDependencies } from '../../../types';

const tabs = [
  {
    id: 'permissions',
    name: 'Permissions',
    disabled: false,
    content: <Fragment>Permission working in progress</Fragment>,
  },
  {
    id: 'users',
    name: 'Users',
    disabled: false,
    content: <Fragment>Users working in progress</Fragment>,
  },
];

interface RoleViewProps extends AppDependencies {
  roleName: string;
}

// TODO: move breadcrumbs to router level as it is common in multiple role related pages.
function createBreadcrumbs(roleName: string) {
  return [
    {
      text: 'Security',
      href: '#',
    },
    {
      text: 'Roles',
      href: '#',
    },
    {
      text: roleName,
    },
  ];
}

export function RoleView(props: RoleViewProps) {
  return (
    <>
      <EuiBreadcrumbs breadcrumbs={createBreadcrumbs(props.roleName)} truncate={false} />

      <EuiPageContentHeader>
        <EuiPageContentHeaderSection>
          <EuiTitle size="l">
            <h1>{props.roleName}</h1>
          </EuiTitle>
        </EuiPageContentHeaderSection>

        <EuiPageContentHeaderSection>
          <EuiButton>Duplicate role</EuiButton>
        </EuiPageContentHeaderSection>
      </EuiPageContentHeader>

      <EuiTabbedContent tabs={tabs} />

      <EuiSpacer />
    </>
  );
}
