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

import React, { useState, useEffect } from 'react';
import { AppDependencies } from '../../types';
import { PanelWithHeader } from '../utils/panel-with-header';
import {
  EuiPageHeader,
  EuiText,
  EuiTitle,
  EuiLink,
  EuiForm,
  EuiFieldText,
  EuiSpacer,
  EuiButton,
  EuiFlexGroup,
  EuiFlexItem,
  EuiComboBoxOptionOption,
  EuiComboBox,
} from '@elastic/eui';
import { FormRow } from '../utils/form-row';
import { CLUSTER_PERMISSIONS, INDEX_PERMISSIONS } from '../constants';
import { fetchActionGroups } from '../utils/action-groups-utils';
import { getRoleDetail } from '../utils/role-detail-utils';

interface RoleEditDeps extends AppDependencies {
  action: 'create' | 'edit' | 'duplicate';
  // For creation, sourceRoleName should be empty string.
  // For editing, sourceRoleName should be the name of the role to edit.
  // For duplication, sourceRoleName should be the name of the role to copy from.
  sourceRoleName: string;
}

type OptionSeletion = EuiComboBoxOptionOption[];

function buildPermissionOptions(optionsList: string[]) {
  return optionsList.map(e => ({ label: e }));
}

export function RoleEdit(props: RoleEditDeps) {
  const [roleName, setRoleName] = useState("");
  const [roleClusterPermission, setRoleClusterPermission] = useState<OptionSeletion>([]);
  useEffect(() => {
    const action = props.action
    if (action == 'edit' || action == 'duplicate') {
      const fetchData = async () => {
        try {
          const roleData = await getRoleDetail(props.coreStart.http, props.sourceRoleName);
          setRoleClusterPermission(buildPermissionOptions(roleData.cluster_permissions));

          if (action == 'edit') {
            setRoleName(props.sourceRoleName);
          }
          if (action == 'duplicate') {
            setRoleName(props.sourceRoleName + '_copy');
          }
        } catch (e) {
          console.log(e);
        }
      };

      fetchData();
    }
  }, []);

  const [actionGroups, setActionGroups] = useState<string[]>([]);
  useEffect(() => {
    const fetchActionGroupNames = async () => {
      const actionGroupsObject = await fetchActionGroups(props.coreStart.http);
      setActionGroups(Object.keys(actionGroupsObject));
    };

    fetchActionGroupNames();
  }, []);

  const titleText = {
    create: 'Create Role',
    edit: 'Edit Role',
    duplicate: 'Duplicate Role',
  }[props.action];

  const clusterWidePermissionOptions = [
    {
      label: 'Permission groups',
      options: buildPermissionOptions(actionGroups),
    },
    {
      label: 'Cluster permissions',
      options: buildPermissionOptions(CLUSTER_PERMISSIONS),
    },
    {
      label: 'Index permissions',
      options: buildPermissionOptions(INDEX_PERMISSIONS),
    },
  ];

  return (
    <>
      <EuiPageHeader>
        <EuiText size="xs" color="subdued">
          <EuiTitle size="m">
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
          <FormRow
            headerText="Name"
            headerSubText="Specify a descriptive and unique role name. You cannot edit the name onece the role is created."
            helpText="The Role name must contain from m to n characters. Valid characters are 
            lowercase a-z, 0-9 and (-) hyphen."
          >
            <EuiFieldText value={ roleName } onChange={e => {setRoleName(e.target.value)}} disabled={props.action == 'edit'} />
          </FormRow>
        </EuiForm>
      </PanelWithHeader>
      <EuiSpacer size="m" />
      <PanelWithHeader
        headerText="Cluster Permissions"
        headerSubText="Specify how users in this role can access the cluster. By default, no cluster permission is granted."
        helpLink="/"
      >
        <EuiForm>
          <FormRow
            headerText="Cluster Permissions"
            headerSubText="Specify permissions using either action groups or single permissions. An action group is a list of single permissions.
            You can often achieve your desired security posture using some combination of the default permission groups. You can
            also create your own reusable permission groups."
          >
            <EuiFlexGroup>
              <EuiFlexItem style={{ maxWidth: '400px' }}>
                <EuiComboBox options={ clusterWidePermissionOptions } selectedOptions={ roleClusterPermission }
                 onChange={ setRoleClusterPermission }/>
              </EuiFlexItem>
              <EuiFlexItem grow={false}>
                <EuiButton>Browse and select</EuiButton>
              </EuiFlexItem>
              <EuiFlexItem grow={false}>
                <EuiButton iconType="popout" iconSide="right">
                  Create Action Groups
                </EuiButton>
              </EuiFlexItem>
            </EuiFlexGroup>
          </FormRow>
        </EuiForm>
      </PanelWithHeader>
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
