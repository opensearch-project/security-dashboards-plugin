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

import React, { Fragment, useState, useEffect, useCallback } from 'react';

import {
  EuiButton,
  EuiPageContentHeader,
  EuiPageContentHeaderSection,
  EuiSpacer,
  EuiTabbedContent,
  EuiTitle,
  EuiPageContent,
  EuiText,
  EuiLink,
  EuiFlexGroup,
  EuiFlexItem,
  EuiPageBody,
  EuiInMemoryTable,
  EuiEmptyPrompt,
  EuiPageHeader,
  EuiGlobalToastList,
} from '@elastic/eui';
import { Toast } from '@elastic/eui/src/components/toast/global_toast_list';
import { isEmpty } from 'lodash';
import { BreadcrumbsPageDependencies } from '../../../types';
import { buildHashUrl } from '../../utils/url-builder';
import { ResourceType, Action, SubAction, RoleMappingDetail } from '../../types';
import {
  getRoleMappingData,
  MappedUsersListing,
  updateRoleMapping,
  transformRoleMappingData,
} from '../../utils/role-mapping-utils';
import { InternalUsersPanel } from '../role-mapping/internal-users-panel';
import { ComboBoxOptions } from '../role-edit/types';
import { ExternalIdentityStateClass } from '../role-mapping/types';
import { fetchUserNameList } from '../../utils/internal-user-list-utils';
import { stringToComboBoxOption, comboBoxOptionToString } from '../../utils/combo-box-utils';
import {
  unbuildExternalIdentityState,
  ExternalIdentitiesPanel,
  buildExternalIdentityState,
} from '../role-mapping/external-identities-panel';

interface RoleViewProps extends BreadcrumbsPageDependencies {
  roleName: string;
  subAction: string;
}

const TITLE_TEXT_DICT = {
  mapuser: 'Map user',
};

const mappedUserColumns = [
  {
    field: 'userType',
    name: 'User type',
    sortable: true,
  },
  {
    field: 'userName',
    name: 'User',
    sortable: true,
    truncateText: true,
  },
];

function createErrorToast(id: string, title: string, text: string): Toast {
  return {
    id,
    color: 'danger',
    title,
    text,
  };
}

function createUnknownErrorToast(id: string, failedAction: string): Toast {
  return createErrorToast(
    id,
    `Failed to ${failedAction}`,
    `Failed to ${failedAction}. You may refresh the page to retry or see browser console for more information.`
  );
}

export function RoleView(props: RoleViewProps) {
  const duplicateRoleLink = buildHashUrl(ResourceType.roles, Action.duplicate, props.roleName);

  const [mappedUsers, setMappedUsers] = useState<MappedUsersListing[]>([]);
  const [errorFlag, setErrorFlag] = useState(false);
  const [selection, setSelection] = useState<MappedUsersListing[]>([]);
  const [internalUsers, setInternalUsers] = useState<ComboBoxOptions>([]);
  const [exterIdentities, setExternalIdentities] = useState<ExternalIdentityStateClass[]>([]);
  const [userNames, setUserNames] = useState<string[]>([]);
  const [hosts, setHosts] = useState<string[]>([]);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const addToast = useCallback((toastToAdd: Toast) => {
    setToasts((state) => state.concat(toastToAdd));
  }, []);
  const removeToast = (toastToDelete: Toast) => {
    setToasts(toasts.filter((toast) => toast.id !== toastToDelete.id));
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const originalRoleMapData = (await getRoleMappingData(
          props.coreStart.http,
          props.roleName
        )) as RoleMappingDetail;
        const roleMappingData = transformRoleMappingData(originalRoleMapData);
        setMappedUsers(roleMappingData);
        if (!isEmpty(originalRoleMapData)) {
          setInternalUsers(originalRoleMapData.users.map(stringToComboBoxOption));
          setExternalIdentities(buildExternalIdentityState(originalRoleMapData.backend_roles));
          setHosts(originalRoleMapData.hosts);
        }
      } catch (e) {
        addToast(createUnknownErrorToast('fetchRoleMappingData', 'load data'));
        console.log(e);
        setErrorFlag(true);
      }
    };

    fetchData();
  }, [addToast, props.coreStart.http, props.roleName]);

  useEffect(() => {
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

  const updateRollMappingHandler = async () => {
    try {
      // Remove empty External Identities
      const validExternalIdentities = exterIdentities.filter(
        (v: ExternalIdentityStateClass) => v.externalIdentity !== ''
      );
      const updateObject: RoleMappingDetail = {
        users: internalUsers.map(comboBoxOptionToString),
        backend_roles: unbuildExternalIdentityState(validExternalIdentities),
        hosts,
      };
      await updateRoleMapping(props.coreStart.http, props.roleName, updateObject);
      addToast({
        id: 'updateRoleMappingSucceeded',
        color: 'success',
        title: props.roleName + ' saved.',
      });
    } catch (e) {
      if (e.message) {
        addToast(createErrorToast('saveRoleMappingFailed', 'save error', e.message));
      } else {
        addToast(createUnknownErrorToast('saveRoleMappingFailed', 'save ' + props.roleName));
        console.error(e);
      }
    }
  };

  const message = (
    <EuiEmptyPrompt
      title={<h2>No user has been mapped to this role</h2>}
      titleSize="s"
      body={
        <EuiText size="s" color="subdued" grow={false}>
          <p>You can map internal users or external identities to this role</p>
        </EuiText>
      }
      actions={
        <EuiFlexGroup gutterSize="s">
          <EuiFlexItem grow={false}>
            <EuiButton
              iconType="popout"
              iconSide="right"
              onClick={() => {
                window.location.href = buildHashUrl(ResourceType.users, Action.create);
              }}
            >
              Create internal user
            </EuiButton>
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiButton
              fill
              onClick={() => {
                window.location.href = buildHashUrl(
                  ResourceType.roles,
                  Action.view,
                  props.roleName,
                  SubAction.mapuser
                );
              }}
            >
              Map users
            </EuiButton>
          </EuiFlexItem>
        </EuiFlexGroup>
      }
    />
  );

  const tabs = [
    {
      id: 'permissions',
      name: 'Permissions',
      disabled: false,
      content: <Fragment>Permission working in progress</Fragment>,
    },
    {
      id: 'users',
      name: 'Mapped users',
      disabled: false,
      content: (
        <>
          <EuiSpacer />
          <EuiPageContent>
            <EuiPageContentHeader>
              <EuiPageContentHeaderSection>
                <EuiTitle size="s">
                  <h3>Mapped users ({mappedUsers.length})</h3>
                </EuiTitle>
                <EuiText size="xs" color="subdued">
                  You can map two types of users: 1. Internal users within the Security plugin. An
                  internal user can have its own backend role and host for an external
                  authentication and authorization. 2. External identity, which directly maps to
                  roles through an external authentication system.{' '}
                  <EuiLink external={true} href="/">
                    Learn More
                  </EuiLink>
                </EuiText>
              </EuiPageContentHeaderSection>
              <EuiPageContentHeaderSection>
                <EuiFlexGroup>
                  <EuiFlexItem>
                    <EuiButton disabled={selection.length === 0}>Delete mapping</EuiButton>
                  </EuiFlexItem>
                  <EuiFlexItem>
                    <EuiButton
                      onClick={() => {
                        window.location.href = buildHashUrl(
                          ResourceType.roles,
                          Action.view,
                          props.roleName,
                          SubAction.mapuser
                        );
                      }}
                    >
                      Manage mapping
                    </EuiButton>
                  </EuiFlexItem>
                </EuiFlexGroup>
              </EuiPageContentHeaderSection>
            </EuiPageContentHeader>
            <EuiPageBody>
              <EuiInMemoryTable
                loading={mappedUsers === [] && !errorFlag}
                columns={mappedUserColumns}
                items={mappedUsers}
                itemId={'userName'}
                pagination={true}
                message={message}
                selection={{ onSelectionChange: setSelection }}
                sorting={true}
                error={
                  errorFlag ? 'Load data failed, please check console log for more detail.' : ''
                }
              />
            </EuiPageBody>
          </EuiPageContent>
        </>
      ),
    },
  ];

  const [selectedTab, setSelectedTab] = useState(tabs[0]);

  const onTabClick = (tab) => {
    setSelectedTab(tab);
  };

  const roleView = (
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

      <EuiTabbedContent tabs={tabs} selectedTab={selectedTab} onTabClick={onTabClick} />

      <EuiSpacer />
    </>
  );

  const mapUser = (
    <>
      {props.buildBreadcrumbs(props.roleName, TITLE_TEXT_DICT[SubAction.mapuser])}
      <EuiPageHeader>
        <EuiText size="xs" color="subdued">
          <EuiTitle size="m">
            <h1>Map user</h1>
          </EuiTitle>
          Map users to this role to inherit role permissions. Two types of users are supported:
          internal user, and external identity.{' '}
          <EuiLink external href="/">
            Learn More
          </EuiLink>
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
        externalIdentities={exterIdentities}
        setExternalIdentities={setExternalIdentities}
      />
      <EuiSpacer size="m" />
      <EuiFlexGroup justifyContent="flexEnd">
        <EuiFlexItem grow={false}>
          <EuiButton
            onClick={() => {
              window.location.href = buildHashUrl(ResourceType.roles, Action.view, props.roleName);
              setSelectedTab(tabs[1]);
            }}
          >
            Cancel
          </EuiButton>
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiButton fill onClick={updateRollMappingHandler}>
            Map
          </EuiButton>
        </EuiFlexItem>
      </EuiFlexGroup>
      <EuiGlobalToastList toasts={toasts} toastLifeTimeMs={10000} dismissToast={removeToast} />
    </>
  );
  console.log(props.subAction);
  if (props.subAction === 'mapuser') {
    return mapUser;
  } else {
    return roleView;
  }
}
