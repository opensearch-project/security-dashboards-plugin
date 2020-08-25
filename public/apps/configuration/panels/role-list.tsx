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
  EuiBasicTableColumn,
} from '@elastic/eui';
import { difference } from 'lodash';
import { AppDependencies } from '../../types';
import {
  transformRoleData,
  buildSearchFilterOptions,
  requestDeleteRoles,
  RoleListing,
} from '../utils/role-list-utils';
import { API_ENDPOINT_ROLES, API_ENDPOINT_ROLESMAPPING } from '../constants';
import { ResourceType, Action } from '../types';
import { buildHashUrl } from '../utils/url-builder';
import { renderCustomization, truncatedListView } from '../utils/display-utils';
import { showMessage } from '../utils/loading-spinner-utils';
import { useDeleteConfirmState } from '../utils/delete-confirm-modal-utils';

const columns: Array<EuiBasicTableColumn<RoleListing>> = [
  {
    field: 'roleName',
    name: 'Role',
    render: (text: string) => (
      <a href={buildHashUrl(ResourceType.roles, Action.view, text)}>{text}</a>
    ),
    sortable: true,
  },
  {
    field: 'clusterPermissions',
    name: 'Cluster permissions',
    render: truncatedListView(),
    truncateText: true,
  },
  {
    field: 'indexPermissions',
    name: 'Index permissions',
    render: truncatedListView(),
    truncateText: true,
  },
  {
    field: 'internalUsers',
    name: 'Internal users',
    render: truncatedListView(),
  },
  {
    field: 'backendRoles',
    name: 'External indentities',
    render: truncatedListView(),
  },
  {
    field: 'tenantPermissions',
    name: 'Tenants',
    render: truncatedListView(),
  },
  {
    field: 'reserved',
    name: 'Customization',
    render: renderCustomization,
  },
];

export function RoleList(props: AppDependencies) {
  const [roleData, setRoleData] = useState<RoleListing[]>([]);
  const [errorFlag, setErrorFlag] = useState(false);
  const [selection, setSelection] = useState<RoleListing[]>([]);
  const [isActionsPopoverOpen, setActionsPopoverOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const rawRoleData = await props.coreStart.http.get(API_ENDPOINT_ROLES);
        const rawRoleMappingData = await props.coreStart.http.get(API_ENDPOINT_ROLESMAPPING);
        const processedData = transformRoleData(rawRoleData, rawRoleMappingData);
        setRoleData(processedData);
      } catch (e) {
        console.log(e);
        setErrorFlag(true);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [props.coreStart.http]);

  const handleDelete = async () => {
    const rolesToDelete: string[] = selection.map((r) => r.roleName);
    try {
      await requestDeleteRoles(props.coreStart.http, rolesToDelete);
      // Refresh from server (calling fetchData) does not work here, the server still return the roles
      // that had been just deleted, probably because ES takes some time to sync to all nodes.
      // So here remove the selected roles from local memory directly.
      setRoleData(difference(roleData, selection));
      setSelection([]);
    } catch (e) {
      console.log(e);
    } finally {
      setActionsPopoverOpen(false);
    }
  };

  const [showDeleteConfirmModal, deleteConfirmModal] = useDeleteConfirmState(
    handleDelete,
    'role(s)'
  );

  const actionsMenuItems = [
    <EuiContextMenuItem
      key="edit"
      onClick={() => {
        window.location.href = buildHashUrl(ResourceType.roles, Action.edit, selection[0].roleName);
      }}
      disabled={selection.length !== 1 || selection[0].reserved}
    >
      Edit
    </EuiContextMenuItem>,
    // TODO: Change duplication to a popup window
    <EuiContextMenuItem
      key="duplicate"
      onClick={() => {
        window.location.href = buildHashUrl(
          ResourceType.roles,
          Action.duplicate,
          selection[0].roleName
        );
      }}
      disabled={selection.length !== 1}
    >
      Duplicate
    </EuiContextMenuItem>,
    <EuiContextMenuItem
      key="delete"
      onClick={showDeleteConfirmModal}
      disabled={selection.length === 0 || selection.some((e) => e.reserved)}
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

  const [searchOptions, setSearchOptions] = useState({});
  useEffect(() => {
    setSearchOptions({
      filters: [
        {
          type: 'field_value_selection',
          field: 'clusterPermissions',
          name: 'Cluster permissions',
          options: buildSearchFilterOptions(roleData, 'clusterPermissions'),
        },
        {
          type: 'field_value_selection',
          field: 'indexPermissions',
          name: 'Index permissions',
          options: buildSearchFilterOptions(roleData, 'indexPermissions'),
        },
        {
          type: 'field_value_selection',
          field: 'internalUsers',
          name: 'Internal users',
          options: buildSearchFilterOptions(roleData, 'internalUsers'),
        },
        {
          type: 'field_value_selection',
          field: 'backendRoles',
          name: 'External identities',
          options: buildSearchFilterOptions(roleData, 'backendRoles'),
        },
        {
          type: 'field_value_selection',
          field: 'tenantPermissions',
          name: 'Tenants',
          options: buildSearchFilterOptions(roleData, 'tenantPermissions'),
        },
        {
          type: 'field_value_selection',
          field: 'reserved',
          name: 'Customization',
          multiSelect: false,
          options: [
            {
              value: true,
              view: renderCustomization(true),
            },
            {
              value: false,
              view: renderCustomization(false),
            },
          ],
        },
      ],
    });
  }, [roleData]);

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
            <EuiTitle size="s">
              <h3>Roles ({roleData.length})</h3>
            </EuiTitle>
            <EuiText size="xs" color="subdued">
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
                <EuiButton fill href={buildHashUrl(ResourceType.roles, Action.create)}>
                  Create role
                </EuiButton>
              </EuiFlexItem>
            </EuiFlexGroup>
          </EuiPageContentHeaderSection>
        </EuiPageContentHeader>
        <EuiPageBody>
          <EuiInMemoryTable
            loading={roleData === [] && !errorFlag}
            columns={columns}
            items={roleData}
            itemId={'roleName'}
            pagination={true}
            selection={{ onSelectionChange: setSelection }}
            sorting={true}
            search={searchOptions}
            error={errorFlag ? 'Load data failed, please check console log for more detail.' : ''}
            message={showMessage(loading, roleData)}
          />
        </EuiPageBody>
        {deleteConfirmModal}
      </EuiPageContent>
    </>
  );
}
