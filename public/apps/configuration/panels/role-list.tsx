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
import {
  EuiFlexGroup,
  EuiText,
  EuiIcon,
  EuiPageHeader,
  EuiTitle,
  EuiPageContent,
  EuiPageContentHeader,
  EuiPageContentHeaderSection,
  EuiLink,
  EuiFlexItem,
  EuiButton,
  EuiPageBody,
  EuiInMemoryTable,
  EuiContextMenuItem,
  EuiPopover,
  EuiContextMenuPanel,
} from '@elastic/eui';
import { AppDependencies } from '../../types';
import { transformRoleData } from '../utils/role-list-utils'

function truncatedListView(limit = 3) {
  return (items: string[]) => {
    // Show - to indicate empty
    if (items == undefined || items.length == 0) {
      return (
        <EuiFlexGroup direction="column" style={{ margin: '1px' }}>
          <EuiText key={'-'} size="xs">
            -
          </EuiText>
        </EuiFlexGroup>
      );
    }

    // If number of items over than limit, truncate and show ...
    return (
      <EuiFlexGroup direction="column" style={{ margin: '1px' }}>
        {items.slice(0, limit).map(item => (
          <EuiText key={item} size="xs">
            {item}
          </EuiText>
        ))}
        {items.length > limit && (
          <EuiText key={'...'} size="xs">
            ...
          </EuiText>
        )}
      </EuiFlexGroup>
    );
  };
}

const columns = [
  {
    field: 'role_name',
    name: 'Role',
    sortable: true,
  },
  {
    field: 'cluster_permissions',
    name: 'Cluster permissions',
    render: truncatedListView(),
    truncateText: true,
  },
  {
    field: 'index_permissions',
    name: 'Index patterns',
    render: truncatedListView(),
    truncateText: true,
  },
  {
    field: 'internal_users',
    name: 'Internal Users',
    render: truncatedListView(),
  },
  {
    field: 'backend_roles',
    name: 'Backend Roles',
    render: truncatedListView(),
  },
  {
    field: 'tenant_permissions',
    name: 'Tenant patterns',
    render: truncatedListView(),
  },
  {
    field: 'reserved',
    name: 'Customization',
    render: (reserved: string) => (
      <>
        <EuiIcon type={reserved ? 'lock' : 'pencil'} />
        <EuiText size="xs">{reserved ? 'Reserved' : 'Custom'}</EuiText>
      </>
    ),
  },
];

export function RoleList(props: AppDependencies) {
  const [roleData, setRoleData] = useState([]);
  const [errorFlag, setErrorFlag] = useState(false);
  const [selection, setSelection] = useState([]);
  const [isActionsPopoverOpen, setActionsPopoverOpen] = useState(false);
  useEffect(() => {
    const fetchData = async () => {
      try {
        const rawRoleData = await props.coreStart.http.get(
          '/api/v1/opendistro_security/configuration/roles'
        );
        const rawRoleMappingData = await props.coreStart.http.get(
          '/api/v1/opendistro_security/configuration/rolesmapping'
        );
        const processedData = transformRoleData(rawRoleData, rawRoleMappingData);
        setRoleData(processedData);
      } catch (e) {
        console.log(e);
        setErrorFlag(true);
      }
    };

    fetchData();
  }, []);

  const actionsMenuItems = [
    <EuiContextMenuItem
      key="edit"
      onClick={() => {}} // TODO: Redirect to edit page
      disabled={selection.length != 1 || selection[0].reserved}
    >
      Edit
    </EuiContextMenuItem>,
    // TODO: Redirect to duplicate page
    <EuiContextMenuItem key="duplicate" onClick={() => {}} disabled={selection.length != 1}>
      Duplicate
    </EuiContextMenuItem>,
    <EuiContextMenuItem
      key="delete"
      onClick={() => {}} // TODO: Delete selection
      disabled={selection.length == 0 || selection.some(e => e.reserved)}
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
          <h1>Roles</h1>
        </EuiTitle>
      </EuiPageHeader>
      <EuiPageContent>
        <EuiPageContentHeader id="role-table-container">
          <EuiPageContentHeaderSection>
            <EuiTitle>
              <h3>Roles</h3>
            </EuiTitle>
            <EuiText size="s" color="subdued">
              Roles are the core way of controlling access to your cluster. Roles contain any
              combinatioin of cluster-wide permission, index-specific permissions, document- and
              field-level security, and tenants. Then you map users to these roles so that users
              gain those permissions. <EuiLink external={true}>Learn More</EuiLink>
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
                <EuiButton fill>Create role</EuiButton>
              </EuiFlexItem>
            </EuiFlexGroup>
          </EuiPageContentHeaderSection>
        </EuiPageContentHeader>
        <EuiPageBody>
          <EuiInMemoryTable
            loading={roleData === [] && !errorFlag}
            columns={columns}
            items={roleData}
            itemId={'role_name'}
            pagination={true}
            selection={{ onSelectionChange: setSelection }}
            sorting={true}
            error={errorFlag ? 'Load data failed, please check console log for more detail.' : ''}
          />
        </EuiPageBody>
      </EuiPageContent>
    </>
  );
}
