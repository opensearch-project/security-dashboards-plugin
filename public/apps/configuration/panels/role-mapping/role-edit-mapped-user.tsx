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
  EuiFlexGroup,
  EuiFlexItem,
  EuiPageHeader,
  EuiSpacer,
  EuiText,
  EuiTitle,
  EuiGlobalToastList,
} from '@elastic/eui';
import React, { useState, useEffect } from 'react';
import { BreadcrumbsPageDependencies } from '../../../types';
import { InternalUsersPanel } from './users-panel';
import {
  ExternalIdentitiesPanel,
  unbuildExternalIdentityState,
  buildExternalIdentityState,
} from './external-identities-panel';
import { ExternalIdentityStateClass } from './types';
import { ComboBoxOptions } from '../../types';
import { stringToComboBoxOption, comboBoxOptionToString } from '../../utils/combo-box-utils';
import { buildHashUrl, buildUrl } from '../../utils/url-builder';
import { ResourceType, RoleMappingDetail, SubAction, Action } from '../../types';
import { fetchUserNameList } from '../../utils/internal-user-list-utils';
import { updateRoleMapping, getRoleMappingData } from '../../utils/role-mapping-utils';
import { createErrorToast, createUnknownErrorToast, useToastState } from '../../utils/toast-utils';
import { DocLinks } from '../../constants';
import { setCrossPageToast } from '../../utils/storage-utils';
import { ExternalLink } from '../../utils/display-utils';

interface RoleEditMappedUserProps extends BreadcrumbsPageDependencies {
  roleName: string;
}

const TITLE_TEXT_DICT = {
  mapuser: 'Map user',
};

export function RoleEditMappedUser(props: RoleEditMappedUserProps) {
  const [internalUsers, setInternalUsers] = React.useState<ComboBoxOptions>([]);
  const [externalIdentities, setExternalIdentities] = React.useState<ExternalIdentityStateClass[]>(
    []
  );
  const [userNames, setUserNames] = useState<string[]>([]);
  const [hosts, setHosts] = React.useState<string[]>([]);
  const [toasts, addToast, removeToast] = useToastState();

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const originalRoleMapData: RoleMappingDetail | undefined = await getRoleMappingData(
          props.coreStart.http,
          props.roleName
        );
        if (originalRoleMapData) {
          setInternalUsers(originalRoleMapData.users.map(stringToComboBoxOption));
          setExternalIdentities(buildExternalIdentityState(originalRoleMapData.backend_roles));
          setHosts(originalRoleMapData.hosts);
        }
      } catch (e) {
        addToast(createUnknownErrorToast('fetchRoleMappingData', 'load data'));
        console.log(e);
      }
    };

    fetchData();
  }, [addToast, props.coreStart.http, props.roleName]);

  React.useEffect(() => {
    const fetchInternalUserNames = async () => {
      try {
        setUserNames(await fetchUserNameList(props.coreStart.http));
      } catch (e) {
        addToast(createUnknownErrorToast('fetchInternalUserNames', 'load data'));
        console.error(e);
      }
    };

    fetchInternalUserNames();
  }, [addToast, props.coreStart.http]);
  const internalUserOptions = userNames.map(stringToComboBoxOption);

  const updateRoleMappingHandler = async () => {
    try {
      // Remove empty backend roles
      const validExternalIdentities = externalIdentities.filter(
        (v: ExternalIdentityStateClass) => v.externalIdentity !== ''
      );
      const updateObject: RoleMappingDetail = {
        users: internalUsers.map(comboBoxOptionToString),
        backend_roles: unbuildExternalIdentityState(validExternalIdentities),
        hosts,
      };

      await updateRoleMapping(props.coreStart.http, props.roleName, updateObject);
      setCrossPageToast(
        buildUrl(ResourceType.roles, Action.view, props.roleName, SubAction.mapuser),
        {
          id: 'updateRoleMappingSucceeded',
          color: 'success',
          title: 'Role "' + props.roleName + '" successfully updated.',
        }
      );
      window.location.href = buildHashUrl(
        ResourceType.roles,
        Action.view,
        props.roleName,
        SubAction.mapuser
      );
    } catch (e) {
      if (e.message) {
        addToast(createErrorToast('saveRoleMappingFailed', 'save error', e.message));
      } else {
        addToast(createUnknownErrorToast('saveRoleMappingFailed', 'save ' + props.roleName));
        console.error(e);
      }
    }
  };

  return (
    <>
      {props.buildBreadcrumbs(props.roleName, TITLE_TEXT_DICT[SubAction.mapuser])}
      <EuiPageHeader>
        <EuiText size="xs" color="subdued">
          <EuiTitle size="m">
            <h1>Map user</h1>
          </EuiTitle>
          Map users to this role to inherit role permissions. Two types of users are supported:
          user, and backend role. <ExternalLink href={DocLinks.MapUsersToRolesDoc} />
        </EuiText>
      </EuiPageHeader>
      <EuiSpacer size="m" />
      <InternalUsersPanel
        state={internalUsers}
        setState={setInternalUsers}
        optionUniverse={internalUserOptions}
      />
      <EuiSpacer size="m" />
      <ExternalIdentitiesPanel
        externalIdentities={externalIdentities}
        setExternalIdentities={setExternalIdentities}
      />
      <EuiSpacer size="m" />
      <EuiFlexGroup justifyContent="flexEnd">
        <EuiFlexItem grow={false}>
          <EuiButton
            onClick={() => {
              window.location.href = buildHashUrl(ResourceType.roles, Action.view, props.roleName);
            }}
          >
            Cancel
          </EuiButton>
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiButton id="map" fill onClick={updateRoleMappingHandler}>
            Map
          </EuiButton>
        </EuiFlexItem>
      </EuiFlexGroup>
      <EuiGlobalToastList toasts={toasts} toastLifeTimeMs={10000} dismissToast={removeToast} />
    </>
  );
}
