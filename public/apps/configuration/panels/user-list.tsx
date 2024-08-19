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
  EuiBadge,
  EuiSmallButton,
  EuiSmallButtonEmpty,
  EuiFlexGroup,
  EuiFlexItem,
  EuiInMemoryTable,
  EuiLink,
  EuiLoadingContent,
  EuiPageBody,
  EuiPageContent,
  EuiPageContentHeader,
  EuiPageContentHeaderSection,
  EuiPageHeader,
  EuiText,
  EuiTitle,
  Query,
} from '@elastic/eui';
import { Dictionary, difference, isEmpty, map } from 'lodash';
import React, { useContext, useState } from 'react';
import { getAuthInfo } from '../../../utils/auth-info-utils';
import { AppDependencies } from '../../types';
import { API_ENDPOINT_INTERNALUSERS, DocLinks } from '../constants';
import { Action } from '../types';
import { ResourceType } from '../../../../common';
import { EMPTY_FIELD_VALUE } from '../ui-constants';
import { useContextMenuState } from '../utils/context-menu';
import { useDeleteConfirmState } from '../utils/delete-confirm-modal-utils';
import { ExternalLink, tableItemsUIProps, truncatedListView } from '../utils/display-utils';
import {
  getUserList,
  InternalUsersListing,
  requestDeleteUsers,
} from '../utils/internal-user-list-utils';
import { showTableStatusMessage } from '../utils/loading-spinner-utils';
import { buildHashUrl } from '../utils/url-builder';
import { DataSourceContext } from '../app-router';
import { SecurityPluginTopNavMenu } from '../top-nav-menu';
import { AccessErrorComponent } from '../access-error-component';
import { PageHeader } from '../header/header-components';

export function dictView(items: Dictionary<string>) {
  if (isEmpty(items)) {
    return EMPTY_FIELD_VALUE;
  }
  return (
    <EuiFlexGroup direction="column" style={{ margin: '1px' }}>
      {map(items, (v, k) => (
        <EuiText key={k} className={tableItemsUIProps.cssClassName}>
          {k}: {`"${v}"`}
        </EuiText>
      ))}
    </EuiFlexGroup>
  );
}

export function getColumns(currentUsername: string) {
  return [
    {
      field: 'username',
      name: 'Username',
      render: (username: string) => (
        <>
          <a href={buildHashUrl(ResourceType.users, Action.edit, username)}>{username}</a>
          {username === currentUsername && (
            <>
              &nbsp;
              <EuiBadge>Current</EuiBadge>
            </>
          )}
        </>
      ),
      sortable: true,
    },
    {
      field: 'backend_roles',
      name: 'Backend roles',
      render: truncatedListView(tableItemsUIProps),
    },
    {
      field: 'attributes',
      name: 'Attributes',
      render: dictView,
      truncateText: true,
    },
  ];
}

export function UserList(props: AppDependencies) {
  const [userData, setUserData] = React.useState<InternalUsersListing[]>([]);
  const [errorFlag, setErrorFlag] = React.useState(false);
  const [accessErrorFlag, setAccessErrorFlag] = React.useState(false);
  const [selection, setSelection] = React.useState<InternalUsersListing[]>([]);
  const [currentUsername, setCurrentUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState<Query | null>(null);
  const { dataSource, setDataSource } = useContext(DataSourceContext)!;

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const userDataPromise = getUserList(
          props.coreStart.http,
          ResourceType.users,
          dataSource.id
        );
        setCurrentUsername((await getAuthInfo(props.coreStart.http)).user_name);
        setUserData(await userDataPromise);
        setErrorFlag(false);
        setAccessErrorFlag(false);
      } catch (e) {
        console.log(e);
        // requests with existing credentials but insufficient permissions result in 403, remote data-source requests with non-existing credentials result in 400
        if (e.response && [400, 403].includes(e.response.status)) {
          setAccessErrorFlag(true);
        }
        setErrorFlag(true);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [props.coreStart.http, dataSource]);

  const handleDelete = async () => {
    const usersToDelete: string[] = selection.map((r) => r.username);
    try {
      await requestDeleteUsers(props.coreStart.http, usersToDelete, dataSource.id);
      // Refresh from server (calling fetchData) does not work here, the server still return the users
      // that had been just deleted, probably because ES takes some time to sync to all nodes.
      // So here remove the selected users from local memory directly.
      setUserData(difference(userData, selection));
      setSelection([]);
    } catch (e) {
      console.log(e);
    } finally {
      closeActionsMenu();
    }
  };

  const [showDeleteConfirmModal, deleteConfirmModal] = useDeleteConfirmState(
    handleDelete,
    'user(s)'
  );

  const actionsMenuItems = [
    <EuiSmallButtonEmpty
      data-test-subj="edit"
      key="edit"
      onClick={() => {
        window.location.href = buildHashUrl(ResourceType.users, Action.edit, selection[0].username);
      }}
      disabled={selection.length !== 1}
    >
      Edit
    </EuiSmallButtonEmpty>,
    <EuiSmallButtonEmpty
      data-test-subj="duplicate"
      key="duplicate"
      onClick={() => {
        window.location.href = buildHashUrl(
          ResourceType.users,
          Action.duplicate,
          selection[0].username
        );
      }}
      disabled={selection.length !== 1}
    >
      Duplicate
    </EuiSmallButtonEmpty>,
    <EuiSmallButtonEmpty
      key="export"
      disabled={selection.length !== 1}
      href={
        selection.length === 1
          ? `${props.coreStart.http.basePath.serverBasePath}${API_ENDPOINT_INTERNALUSERS}/${selection[0].username}`
          : ''
      }
      target="_blank"
    >
      Export JSON
    </EuiSmallButtonEmpty>,
    <EuiSmallButtonEmpty
      key="delete"
      color="danger"
      onClick={showDeleteConfirmModal}
      disabled={selection.length === 0 || selection.some((e) => e.username === currentUsername)}
    >
      Delete
    </EuiSmallButtonEmpty>,
  ];

  const [actionsMenu, closeActionsMenu] = useContextMenuState('Actions', {}, actionsMenuItems);

  const useUpdatedUX = props.coreStart.uiSettings.get('home:useNewHomePage');
  const buttonData = [
    {
      label: 'Create internal user',
      isLoading: false,
      href: buildHashUrl(ResourceType.users, Action.create),
      fill: true,
      iconType: 'plus',
      iconSide: 'left',
      type: 'button',
      testId: 'create-user',
    },
  ];
  const descriptionData = [
    {
      isLoading: loading,
      renderComponent: (
        <EuiText size="xs" color="subdued">
          The Security plugin includes an internal user database. Use this database in place of, or
          in addition to, an external <br /> authentication system such as LDAP server or Active
          Directory. You can map an internal user to a role from{' '}
          <EuiLink href={buildHashUrl(ResourceType.roles)}>Roles</EuiLink>
          . First, click <br /> into the detail page of the role. Then, under “Mapped users”, click
          “Manage mapping” <ExternalLink href={DocLinks.MapUsersToRolesDoc} />
        </EuiText>
      ),
    },
  ];

  const userLen = Query.execute(query || '', userData).length;
  return (
    <>
      <SecurityPluginTopNavMenu
        {...props}
        dataSourcePickerReadOnly={false}
        setDataSource={setDataSource}
        selectedDataSource={dataSource}
      />
      <PageHeader
        navigation={props.depsStart.navigation}
        coreStart={props.coreStart}
        descriptionControls={descriptionData}
        appRightControls={buttonData}
        fallBackComponent={
          <EuiPageHeader>
            <EuiTitle size="l">
              <h1>Internal users</h1>
            </EuiTitle>
          </EuiPageHeader>
        }
        resourceType={ResourceType.users}
        count={userData.length}
      />
      {loading ? (
        <EuiLoadingContent />
      ) : accessErrorFlag ? (
        <AccessErrorComponent loading={loading} dataSourceLabel={dataSource && dataSource.label} />
      ) : (
        <EuiPageContent>
          {useUpdatedUX ? null : (
            <EuiPageContentHeader>
              <EuiPageContentHeaderSection>
                <EuiTitle size="s">
                  <h3>
                    Internal users
                    <span className="panel-header-count"> ({userLen})</span>
                  </h3>
                </EuiTitle>
                <EuiText size="xs" color="subdued">
                  The Security plugin includes an internal user database. Use this database in place
                  of, or in addition to, an external authentication system such as LDAP server or
                  Active Directory. You can map an internal user to a role from{' '}
                  <EuiLink href={buildHashUrl(ResourceType.roles)}>Roles</EuiLink>
                  . First, click into the detail page of the role. Then, under “Mapped users”, click
                  “Manage mapping” <ExternalLink href={DocLinks.MapUsersToRolesDoc} />
                </EuiText>
              </EuiPageContentHeaderSection>
              <EuiPageContentHeaderSection>
                <EuiFlexGroup>
                  <EuiFlexItem>{actionsMenu}</EuiFlexItem>
                  <EuiFlexItem>
                    <EuiSmallButton
                      fill
                      href={buildHashUrl(ResourceType.users, Action.create)}
                      data-test-subj="create-user"
                    >
                      Create internal user
                    </EuiSmallButton>
                  </EuiFlexItem>
                </EuiFlexGroup>
              </EuiPageContentHeaderSection>
            </EuiPageContentHeader>
          )}
          <EuiPageBody>
            <EuiInMemoryTable
              tableLayout={'auto'}
              loading={userData === [] && !errorFlag}
              columns={getColumns(currentUsername)}
              // @ts-ignore
              items={userData}
              itemId={'username'}
              pagination
              search={{
                box: { placeholder: 'Search internal users' },
                onChange: (arg) => {
                  setQuery(arg.query);
                  return true;
                },
                toolsRight: useUpdatedUX ? [<EuiFlexItem>{actionsMenu}</EuiFlexItem>] : undefined,
              }}
              // @ts-ignore
              selection={{ onSelectionChange: setSelection }}
              sorting
              error={errorFlag ? 'Load data failed, please check console log for more detail.' : ''}
              message={showTableStatusMessage(loading, userData)}
            />
          </EuiPageBody>
          {deleteConfirmModal}
        </EuiPageContent>
      )}
    </>
  );
}
