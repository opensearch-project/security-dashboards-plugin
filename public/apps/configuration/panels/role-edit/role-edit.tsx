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

import {
  EuiFieldText,
  EuiForm,
  EuiLink,
  EuiPageHeader,
  EuiSpacer,
  EuiText,
  EuiTitle,
} from '@elastic/eui';
import React, { useEffect, useState } from 'react';
import { AppDependencies } from '../../../types';
import { CLUSTER_PERMISSIONS, INDEX_PERMISSIONS } from '../../constants';
import { fetchActionGroups } from '../../utils/action-groups-utils';
import { stringToComboBoxOption } from '../../utils/combo-box-utils';
import { FormRow } from '../../utils/form-row';
import { PanelWithHeader } from '../../utils/panel-with-header';
import { getRoleDetail } from '../../utils/role-detail-utils';
import { buildIndexPermissionState, IndexPermissionPanel } from './index-permission-panel';
import { TenantPanel } from './tenant-panel';
import { ComboBoxOptions, RoleIndexPermissionStateClass } from './types';
import { ClusterPermissionPanel } from './cluster-permission-panel';

interface RoleEditDeps extends AppDependencies {
  action: 'create' | 'edit' | 'duplicate';
  // For creation, sourceRoleName should be empty string.
  // For editing, sourceRoleName should be the name of the role to edit.
  // For duplication, sourceRoleName should be the name of the role to copy from.
  sourceRoleName: string;
}

const TITLE_TEXT_DICT = {
  create: 'Create Role',
  edit: 'Edit Role',
  duplicate: 'Duplicate Role',
};

export function RoleEdit(props: RoleEditDeps) {
  const [roleName, setRoleName] = useState('');
  const [roleClusterPermission, setRoleClusterPermission] = useState<ComboBoxOptions>([]);
  const [roleIndexPermission, setRoleIndexPermission] = useState<RoleIndexPermissionStateClass[]>(
    []
  );

  useEffect(() => {
    const action = props.action;
    if (action == 'edit' || action == 'duplicate') {
      const fetchData = async () => {
        try {
          const roleData = await getRoleDetail(props.coreStart.http, props.sourceRoleName);
          setRoleClusterPermission(roleData.cluster_permissions.map(stringToComboBoxOption));
          setRoleIndexPermission(buildIndexPermissionState(roleData.index_permissions));

          if (action == 'edit') {
            setRoleName(props.sourceRoleName);
          } else {
            setRoleName(props.sourceRoleName + '_copy');
          }
        } catch (e) {
          // TODO: show user friendly error message
          console.log(e);
        }
      };

      fetchData();
    }
  }, [props.sourceRoleName]);

  const [actionGroups, setActionGroups] = useState<string[]>([]);
  useEffect(() => {
    const fetchActionGroupNames = async () => {
      try {
        const actionGroupsObject = await fetchActionGroups(props.coreStart.http);
        setActionGroups(Object.keys(actionGroupsObject));
      } catch (e) {
        // TODO: show user friendly error message
        console.log(e);
      }
    };

    fetchActionGroupNames();
  }, []);

  const clusterWisePermissionOptions = [
    {
      label: 'Permission groups',
      options: actionGroups.map(stringToComboBoxOption),
    },
    {
      label: 'Cluster permissions',
      options: CLUSTER_PERMISSIONS.map(stringToComboBoxOption),
    },
    {
      label: 'Index permissions',
      options: INDEX_PERMISSIONS.map(stringToComboBoxOption),
    },
  ];

  return (
    <>
      <EuiPageHeader>
        <EuiText size="xs" color="subdued">
          <EuiTitle size="m">
            <h1>{TITLE_TEXT_DICT[props.action]}</h1>
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
            headerSubText="Specify a descriptive and unique role name. You cannot edit the name once the role is created."
            helpText="The Role name must contain from m to n characters. Valid characters are 
            lowercase a-z, 0-9 and (-) hyphen."
          >
            <EuiFieldText
              value={roleName}
              onChange={e => {
                setRoleName(e.target.value);
              }}
              disabled={props.action == 'edit'}
            />
          </FormRow>
        </EuiForm>
      </PanelWithHeader>
      <EuiSpacer size="m" />
      <ClusterPermissionPanel
        state={roleClusterPermission}
        setState={setRoleClusterPermission}
        optionUniverse={clusterWisePermissionOptions}
      />
      <EuiSpacer size="m" />
      <IndexPermissionPanel
        state={roleIndexPermission}
        setState={setRoleIndexPermission}
        optionUniverse={clusterWisePermissionOptions}
      />
      <EuiSpacer size="m" />
      <TenantPanel />
    </>
  );
}
