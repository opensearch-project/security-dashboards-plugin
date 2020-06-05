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
  EuiContextMenuItem,
  EuiContextMenuPanel,
  EuiFlexGroup,
  EuiFlexItem,
  EuiInMemoryTable,
  EuiLink,
  EuiPageBody,
  EuiPageContent,
  EuiPageContentHeader,
  EuiPageContentHeaderSection,
  EuiPageHeader,
  EuiPopover,
  EuiText,
  EuiTitle,
} from '@elastic/eui';
import { difference, map, Dictionary } from 'lodash';
import React, { useEffect, useState } from 'react';
import { AppDependencies } from '../../types';
import {
  getUserList,
  InternalUsersListing,
  requestDeleteUsers,
} from '../utils/internal-user-list-utils';

function dictView() {
  return (items: Dictionary<string>) => {
    return (
      <EuiFlexGroup direction="column" style={{ margin: '1px' }}>
        {map(items, (v, k) => (
          <EuiText key={k} size="xs">
            {k}: {v}
          </EuiText>
        ))}
      </EuiFlexGroup>
    );
  };
}

const columns = [
  {
    field: 'username',
    name: 'Username',
    sortable: true,
  },
  {
    field: 'attributes',
    name: 'Attributes',
    render: dictView(),
    truncateText: true,
  },
];

export function UserList(props: AppDependencies) {
  const [userData, setUserData] = useState<InternalUsersListing[]>([]);
  const [errorFlag, setErrorFlag] = useState(false);
  const [selection, setSelection] = useState<InternalUsersListing[]>([]);
  const [isActionsPopoverOpen, setActionsPopoverOpen] = useState(false);
  const [currentUsername, setCurrentUsername] = useState('');
  useEffect(() => {
    const fetchData = async () => {
      try {
        setUserData(await getUserList(props.coreStart.http));
      } catch (e) {
        console.log(e);
        setErrorFlag(true);
      }
    };

    fetchData();
  }, [props.coreStart.http]);

  const handleDelete = async () => {
    const usersToDelete: string[] = selection.map((r) => r.username);
    try {
      await requestDeleteUsers(props.coreStart.http, usersToDelete);
      // Refresh from server (calling fetchData) does not work here, the server still return the roles
      // that had been just deleted, probably because ES takes some time to sync to all nodes.
      // So here remove the selected roles from local memory directly.
      setUserData(difference(userData, selection));
      setSelection([]);
    } catch (e) {
      console.log(e);
    } finally {
      setActionsPopoverOpen(false);
    }
  };

  const actionsMenuItems = [
    <EuiContextMenuItem
      key="edit"
      onClick={() => {}} // TODO: Redirect to edit page
      disabled={selection.length !== 1}
    >
      Edit
    </EuiContextMenuItem>,
    // TODO: Redirect to duplicate page
    <EuiContextMenuItem key="duplicate" onClick={() => {}} disabled={selection.length !== 1}>
      Duplicate
    </EuiContextMenuItem>,
    <EuiContextMenuItem
      key="delete"
      onClick={handleDelete}
      disabled={selection.length === 0 || selection.some((e) => e.username === currentUsername)}
    >
      Delete
    </EuiContextMenuItem>,
  ];

  const actionsButton = (
    <EuiButton
      iconType="arrowDown"
      iconSide="right"
      onClick={() => {
        setActionsPopoverOpen(true);
      }}
    >
      Actions
    </EuiButton>
  );

  return (
    <>
      <EuiPageHeader>
        <EuiTitle size="l">
          <h1>Internal users</h1>
        </EuiTitle>
      </EuiPageHeader>
      <EuiPageContent>
        <EuiPageContentHeader>
          <EuiPageContentHeaderSection>
            <EuiTitle size="s">
              <h3>Internal users ({userData.length})</h3>
            </EuiTitle>
            <EuiText size="xs" color="subdued">
              The Security plugin includes an internal user database. Use this database in place of
              or in addition to an external authentication system such as LDAP or Active Directory.
              You can map an internal user to a role from Roles. First, click into the detail page
              of the role. Then under “Mapped users”, click “Manage mapping”.{' '}
              <EuiLink external={true} href="/">
                Learn More
              </EuiLink>
            </EuiText>
          </EuiPageContentHeaderSection>
          <EuiPageContentHeaderSection>
            <EuiFlexGroup>
              <EuiFlexItem>
                <EuiPopover
                  id="actionsMenu"
                  button={actionsButton}
                  isOpen={isActionsPopoverOpen}
                  closePopover={() => {
                    setActionsPopoverOpen(false);
                  }}
                  panelPaddingSize="s"
                >
                  <EuiContextMenuPanel items={actionsMenuItems} />
                </EuiPopover>
              </EuiFlexItem>
              <EuiFlexItem>
                <EuiButton fill>Create user</EuiButton>
              </EuiFlexItem>
            </EuiFlexGroup>
          </EuiPageContentHeaderSection>
        </EuiPageContentHeader>
        <EuiPageBody>
          <EuiInMemoryTable
            loading={userData === [] && !errorFlag}
            columns={columns}
            items={userData}
            itemId={'username'}
            pagination
            search
            selection={{ onSelectionChange: setSelection }}
            sorting
            error={errorFlag ? 'Load data failed, please check console log for more detail.' : ''}
          />
        </EuiPageBody>
      </EuiPageContent>
    </>
  );
}
