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

import React from 'react';
import { AppDependencies } from '../../types';
import { PanelWithHeader } from '../utils/panel-with-header';
import {
  EuiPageHeader,
  EuiText,
  EuiTitle,
  EuiLink,
  EuiForm,
  EuiFormRow,
  EuiFieldText,
  EuiSpacer,
} from '@elastic/eui';

interface RoleEditDeps extends AppDependencies {
  action: 'create' | 'edit' | 'duplicate';
  // For creation, sourceRoleName should be empty string.
  // For editing, sourceRoleName should be the name of the role to edit.
  // For duplication, sourceRoleName should be the name of the role to copy from.
  sourceRoleName: string;
}

export function RoleEdit(props: RoleEditDeps) {
  const titleText = {
    create: 'Create Role',
    edit: 'Edit Role',
    duplicate: 'Duplicate Role',
  }[props.action];

  return (
    <>
      <EuiPageHeader>
        <EuiText size="s" color="subdued">
          <EuiTitle size="l">
            <h1>{titleText}</h1>
          </EuiTitle>
          Roles are the core way of controlling access to your cluster. Roles contain any
          combination of cluster-wide permission, index-specific permissions, document- and
          field-level security, and tenants. Once you've created the role, you can map users to
          these roles so that users gain those permissions.{' '}
          <EuiLink external href="/">
            Learn More
          </EuiLink>
        </EuiText>
      </EuiPageHeader>
      <PanelWithHeader headerText="Name">
        <EuiForm>
          <EuiFormRow
            label={
              <EuiText size="xs" color="subdued">
                <EuiTitle size="xxs">
                  <h4>Name</h4>
                </EuiTitle>
                Specify a descriptive and unique role name. You cannot edit the name onece the role
                is created.
              </EuiText>
            }
            helpText="The Role name must contain from m to n characters. Valid characters are 
            lowercase a-z, 0-9 and (-) hyphen."
          >
            <EuiFieldText />
          </EuiFormRow>
        </EuiForm>
      </PanelWithHeader>
      <EuiSpacer size="m" />
      <PanelWithHeader
        headerText="Cluster Permissions"
        headerSubText="Specify how users in this role can access the cluster. By default, no cluster permission is granted."
        helpLink="/"
      ></PanelWithHeader>
      <EuiSpacer size="m" />
      <PanelWithHeader
        headerText="Index Permissions"
        headerSubText="Index permissions allow you to specify how users in this role can access the specific indices. By default, no index permission is granted."
        helpLink="/"
      ></PanelWithHeader>
      <EuiSpacer size="m" />
      <PanelWithHeader
        headerText="Tenants"
        headerSubText="Tenants are useful for safely sharing your work with other Kibana users. You can control which roles have access to a tenant and whether those rolels have read or write access."
        helpLink="/"
      ></PanelWithHeader>
    </>
  );
}
