/*
 *   Copyright OpenSearch Contributors
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
  EuiFlexGroup,
  EuiFlexItem,
  EuiForm,
  EuiGlobalToastList,
  EuiPageHeader,
  EuiSpacer,
  EuiText,
  EuiTitle,
} from '@elastic/eui';
import React, { useState } from 'react';
import { isEmpty } from 'lodash';
import { BreadcrumbsPageDependencies } from '../../../types';
import { CLUSTER_PERMISSIONS, DocLinks, INDEX_PERMISSIONS } from '../../constants';
import { fetchActionGroups } from '../../utils/action-groups-utils';
import { comboBoxOptionToString, stringToComboBoxOption } from '../../utils/combo-box-utils';
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
import { RoleIndexPermissionStateClass, RoleTenantPermissionStateClass } from './types';
import { buildHashUrl, buildUrl } from '../../utils/url-builder';
import { ComboBoxOptions, ResourceType, Action, ActionGroupItem } from '../../types';
import {
  useToastState,
  createUnknownErrorToast,
  getSuccessToastMessage,
} from '../../utils/toast-utils';
import { setCrossPageToast } from '../../utils/storage-utils';
import { ExternalLink } from '../../utils/display-utils';
import { generateResourceName } from '../../utils/resource-utils';
import { NameRow } from '../../utils/name-row';

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

export function RoleEdit(props: RoleEditDeps) {
  const [roleName, setRoleName] = React.useState('');
  const [roleClusterPermission, setRoleClusterPermission] = useState<ComboBoxOptions>([]);
  const [roleIndexPermission, setRoleIndexPermission] = useState<RoleIndexPermissionStateClass[]>(
    []
  );
  const [roleTenantPermission, setRoleTenantPermission] = useState<
    RoleTenantPermissionStateClass[]
  >([]);

  const [toasts, addToast, removeToast] = useToastState();

  const [isFormValid, setIsFormValid] = useState<boolean>(true);

  React.useEffect(() => {
    const action = props.action;
    if (action === 'edit' || action === 'duplicate') {
      const fetchData = async () => {
        try {
          const roleData = await getRoleDetail(props.coreStart.http, props.sourceRoleName);
          setRoleClusterPermission(roleData.cluster_permissions.map(stringToComboBoxOption));
          setRoleIndexPermission(buildIndexPermissionState(roleData.index_permissions));
          setRoleTenantPermission(buildTenantPermissionState(roleData.tenant_permissions));

          setRoleName(generateResourceName(action, props.sourceRoleName));
        } catch (e) {
          addToast(createUnknownErrorToast('fetchRole', 'load data'));
          console.error(e);
        }
      };

      fetchData();
    }
  }, [addToast, props.action, props.coreStart.http, props.sourceRoleName]);

  const [actionGroups, setActionGroups] = useState<Array<[string, ActionGroupItem]>>([]);
  React.useEffect(() => {
    const fetchActionGroupNames = async () => {
      try {
        const actionGroupsObject = await fetchActionGroups(props.coreStart.http);
        setActionGroups(Object.entries(actionGroupsObject));
      } catch (e) {
        addToast(createUnknownErrorToast('actionGroup', 'load data'));
        console.error(e);
      }
    };

    fetchActionGroupNames();
  }, [addToast, props.coreStart.http]);

  const [tenantNames, setTenantNames] = React.useState<string[]>([]);
  React.useEffect(() => {
    const fetchTenantNames = async () => {
      try {
        setTenantNames(await fetchTenantNameList(props.coreStart.http));
      } catch (e) {
        addToast(createUnknownErrorToast('tenant', 'load data'));
        console.error(e);
      }
    };

    fetchTenantNames();
  }, [addToast, props.coreStart.http]);

  const updateRoleHandler = async () => {
    try {
      // Remove index/tenant permissions with empty patterns.
      const validIndexPermission = roleIndexPermission.filter(
        (v: RoleIndexPermissionStateClass) => !isEmpty(v.indexPatterns)
      );
      const validTenantPermission = roleTenantPermission.filter(
        (v: RoleTenantPermissionStateClass) => !isEmpty(v.tenantPatterns)
      );

      await updateRole(props.coreStart.http, roleName, {
        cluster_permissions: roleClusterPermission.map(comboBoxOptionToString),
        index_permissions: unbuildIndexPermissionState(validIndexPermission),
        tenant_permissions: unbuildTenantPermissionState(validTenantPermission),
      });

      setCrossPageToast(buildUrl(ResourceType.roles, Action.view, roleName), {
        id: 'updateRoleSucceeded',
        color: 'success',
        title: getSuccessToastMessage('Role', props.action, roleName),
      });
      // Redirect to role view
      window.location.href = buildHashUrl(ResourceType.roles, Action.view, roleName);
    } catch (e) {
      addToast(createUnknownErrorToast('updateRole', `${props.action} role`));
      console.error(e);
    }
  };

  const clusterWisePermissionOptions = [
    {
      label: 'Permission groups',
      options: actionGroups
        .filter((actionGroup) => actionGroup[1].type === 'cluster')
        .map((actionGroup) => actionGroup[0])
        .map(stringToComboBoxOption),
    },
    {
      label: 'Cluster permissions',
      options: CLUSTER_PERMISSIONS.map(stringToComboBoxOption),
    },
  ];

  const indexWisePermissionOptions = [
    {
      label: 'Permission groups',
      options: actionGroups
        .filter((actionGroup) => actionGroup[1].type === 'index')
        .map((actionGroup) => actionGroup[0])
        .map(stringToComboBoxOption),
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
        <EuiText size="xs" color="subdued" className="panel-header-subtext">
          <EuiTitle size="m">
            <h1>{TITLE_TEXT_DICT[props.action]}</h1>
          </EuiTitle>
          Roles are the core way of controlling access to your cluster. Roles contain any
          combination of cluster-wide permission, index-specific permissions, document- and
          field-level security, and tenants. Once you&apos;ve created the role, you can map users to
          the roles so that users gain those permissions.{' '}
          <ExternalLink href={DocLinks.UsersAndRolesDoc} />
        </EuiText>
      </EuiPageHeader>
      <PanelWithHeader headerText="Name">
        <EuiForm>
          <NameRow
            headerText="Name"
            headerSubText="Specify a descriptive and unique role name. You cannot edit the name once the role is created."
            resourceName={roleName}
            resourceType="role"
            action={props.action}
            setNameState={setRoleName}
            setIsFormValid={setIsFormValid}
          />
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
        optionUniverse={indexWisePermissionOptions}
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
          <EuiButton fill onClick={updateRoleHandler} disabled={!isFormValid}>
            {props.action === 'edit' ? 'Update' : 'Create'}
          </EuiButton>
        </EuiFlexItem>
      </EuiFlexGroup>
      <EuiGlobalToastList toasts={toasts} toastLifeTimeMs={10000} dismissToast={removeToast} />
    </>
  );
}
