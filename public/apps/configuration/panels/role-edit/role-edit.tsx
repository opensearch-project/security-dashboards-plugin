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
  EuiButton,
  EuiFieldText,
  EuiFlexGroup,
  EuiFlexItem,
  EuiForm,
  EuiGlobalToastList,
  EuiLink,
  EuiPageHeader,
  EuiSpacer,
  EuiText,
  EuiTitle,
} from '@elastic/eui';
import { Toast } from '@elastic/eui/src/components/toast/global_toast_list';
import React, { useEffect, useState, useCallback } from 'react';
import { BreadcrumbsPageDependencies } from '../../../types';
import { CLUSTER_PERMISSIONS, INDEX_PERMISSIONS } from '../../constants';
import { fetchActionGroups } from '../../utils/action-groups-utils';
import { comboBoxOptionToString, stringToComboBoxOption } from '../../utils/combo-box-utils';
import { FormRow } from '../../utils/form-row';
import { PanelWithHeader } from '../../utils/panel-with-header';
import { getRoleDetail, updateRole } from '../../utils/role-detail-utils';
import { fetchTenantNameList } from '../../utils/tenant-utils';
import { ClusterPermissionPanel } from './cluster-permission-panel';
import {
  buildIndexPermissionState,
  IndexPermissionPanel,
  unbuildIndexPermissionState,
} from './index-permission-panel';
import {
  buildTenantPermissionState,
  TenantPanel,
  unbuildTenantPermissionState,
} from './tenant-panel';
import {
  ComboBoxOptions,
  RoleIndexPermissionStateClass,
  RoleTenantPermissionStateClass,
} from './types';
import { buildHashUrl } from '../../utils/url-builder';
import { ResourceType, Action } from '../../types';

interface RoleEditDeps extends BreadcrumbsPageDependencies {
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

function createErrorToast(id: string, failedAction: string): Toast {
  return {
    id,
    color: 'danger',
    title: `Failed to ${failedAction}`,
    text: `Failed to ${failedAction}. You may refresh the page to retry or see browser console for more information.`,
  };
}

export function RoleEdit(props: RoleEditDeps) {
  const [roleName, setRoleName] = useState('');
  const [roleClusterPermission, setRoleClusterPermission] = useState<ComboBoxOptions>([]);
  const [roleIndexPermission, setRoleIndexPermission] = useState<RoleIndexPermissionStateClass[]>(
    []
  );
  const [roleTenantPermission, setRoleTenantPermission] = useState<
    RoleTenantPermissionStateClass[]
  >([]);

  const [toasts, setToasts] = useState<Toast[]>([]);
  const addToast = useCallback((toastToAdd: Toast) => {
    setToasts((state) => state.concat(toastToAdd));
  }, []);
  const removeToast = (toastToDelete: Toast) => {
    setToasts(toasts.filter((toast) => toast.id !== toastToDelete.id));
  };

  useEffect(() => {
    const action = props.action;
    if (action === 'edit' || action === 'duplicate') {
      const fetchData = async () => {
        try {
          const roleData = await getRoleDetail(props.coreStart.http, props.sourceRoleName);
          setRoleClusterPermission(roleData.cluster_permissions.map(stringToComboBoxOption));
          setRoleIndexPermission(buildIndexPermissionState(roleData.index_permissions));
          setRoleTenantPermission(buildTenantPermissionState(roleData.tenant_permissions));

          if (action === 'edit') {
            setRoleName(props.sourceRoleName);
          } else {
            setRoleName(props.sourceRoleName + '_copy');
          }
        } catch (e) {
          addToast(createErrorToast('fetchRole', 'load data'));
          console.error(e);
        }
      };

      fetchData();
    }
  }, [addToast, props.action, props.coreStart.http, props.sourceRoleName]);

  const [actionGroups, setActionGroups] = useState<string[]>([]);
  useEffect(() => {
    const fetchActionGroupNames = async () => {
      try {
        const actionGroupsObject = await fetchActionGroups(props.coreStart.http);
        setActionGroups(Object.keys(actionGroupsObject));
      } catch (e) {
        addToast(createErrorToast('actionGroup', 'load data'));
        console.error(e);
      }
    };

    fetchActionGroupNames();
  }, [addToast, props.coreStart.http]);

  const [tenantNames, setTenantNames] = useState<string[]>([]);
  useEffect(() => {
    const fetchTenantNames = async () => {
      try {
        setTenantNames(await fetchTenantNameList(props.coreStart.http));
      } catch (e) {
        addToast(createErrorToast('tenant', 'load data'));
        console.error(e);
      }
    };

    fetchTenantNames();
  }, [addToast, props.coreStart.http]);

  const updateRoleHandler = async () => {
    try {
      await updateRole(props.coreStart.http, roleName, {
        cluster_permissions: roleClusterPermission.map(comboBoxOptionToString),
        index_permissions: unbuildIndexPermissionState(roleIndexPermission),
        tenant_permissions: unbuildTenantPermissionState(roleTenantPermission),
      });
      window.location.href = buildHashUrl(ResourceType.roles, Action.view, roleName);
    } catch (e) {
      addToast(createErrorToast('updateRole', `${props.action} role`));
      console.error(e);
    }
  };

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

  const tenantOptions = tenantNames.map(stringToComboBoxOption);

  return (
    <>
      {props.buildBreadcrumbs(TITLE_TEXT_DICT[props.action])}
      <EuiPageHeader>
        <EuiText size="xs" color="subdued">
          <EuiTitle size="m">
            <h1>{TITLE_TEXT_DICT[props.action]}</h1>
          </EuiTitle>
          Roles are the core way of controlling access to your cluster. Roles contain any
          combination of cluster-wide permission, index-specific permissions, document- and
          field-level security, and tenants. Once you&apos;ve created the role, you can map users to
          the roles so that users gain those permissions.{' '}
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
              onChange={(e) => {
                setRoleName(e.target.value);
              }}
              disabled={props.action === 'edit'}
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
      <TenantPanel
        state={roleTenantPermission}
        setState={setRoleTenantPermission}
        optionUniverse={tenantOptions}
      />
      <EuiSpacer size="m" />
      <EuiFlexGroup justifyContent="flexEnd">
        <EuiFlexItem grow={false}>
          <EuiButton
            onClick={() => {
              window.location.href = buildHashUrl(ResourceType.roles);
            }}
          >
            Cancel
          </EuiButton>
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiButton fill onClick={updateRoleHandler}>
            {props.action === 'edit' ? 'Update' : 'Create'}
          </EuiButton>
        </EuiFlexItem>
      </EuiFlexGroup>
      <EuiGlobalToastList toasts={toasts} toastLifeTimeMs={10000} dismissToast={removeToast} />
    </>
  );
}
