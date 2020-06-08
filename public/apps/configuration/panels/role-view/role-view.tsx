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
  EuiButton,
  EuiPageContentHeader,
  EuiPageContentHeaderSection,
  EuiSpacer,
  EuiTabbedContent,
  EuiTitle,
} from '@elastic/eui';
import { SingleResourcePageDependencies } from '../../../types';
import { DUPLICATE_ROLES_URL_PREFIX } from '../../constants';

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

interface RoleViewProps extends SingleResourcePageDependencies {
  roleName: string;
}

export function RoleView(props: RoleViewProps) {
  const duplicateRoleLink = DUPLICATE_ROLES_URL_PREFIX + props.roleName;

  return (
    <>
      {props.buildBreadcrumbs(props.roleName)}

      <EuiPageContentHeader>
        <EuiPageContentHeaderSection>
          <EuiTitle size="l">
            <h1>{props.roleName}</h1>
          </EuiTitle>
        </EuiPageContentHeaderSection>

        <EuiPageContentHeaderSection>
          <EuiButton href={duplicateRoleLink}>Duplicate role</EuiButton>
        </EuiPageContentHeaderSection>
      </EuiPageContentHeader>

      <EuiTabbedContent tabs={tabs} />

      <EuiSpacer />
    </>
  );
}
