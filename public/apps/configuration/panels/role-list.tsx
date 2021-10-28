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

import React, { useState, useEffect } from 'react';
import {
  EuiFlexGroup,
  EuiText,
  EuiPageHeader,
  EuiTitle,
  EuiPageContent,
  EuiPageContentHeader,
  EuiPageContentHeaderSection,
  EuiFlexItem,
  EuiButton,
  EuiPageBody,
  EuiInMemoryTable,
  EuiBasicTableColumn,
  EuiButtonEmpty,
  EuiSearchBarProps,
  Query,
} from '@elastic/eui';
import { difference } from 'lodash';
import { AppDependencies } from '../../types';
import {
  transformRoleData,
  requestDeleteRoles,
  RoleListing,
  fetchRole,
  fetchRoleMapping,
  buildSearchFilterOptions,
} from '../utils/role-list-utils';
import { ResourceType, Action } from '../types';
import { buildHashUrl } from '../utils/url-builder';
import {
  ExternalLink,
  renderCustomization,
  truncatedListView,
  tableItemsUIProps,
} from '../utils/display-utils';
import { showTableStatusMessage } from '../utils/loading-spinner-utils';
import { useDeleteConfirmState } from '../utils/delete-confirm-modal-utils';
import { useContextMenuState } from '../utils/context-menu';
import { DocLinks } from '../constants';

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
    render: truncatedListView(tableItemsUIProps),
    truncateText: true,
  },
  {
    field: 'indexPermissions',
    name: 'Index permissions',
    render: truncatedListView(tableItemsUIProps),
    truncateText: true,
  },
  {
    field: 'internalUsers',
    name: 'Internal users',
    render: truncatedListView(tableItemsUIProps),
  },
  {
    field: 'backendRoles',
    name: 'Backend roles',
    render: truncatedListView(tableItemsUIProps),
  },
  {
    field: 'tenantPermissions',
    name: 'Tenants',
    render: truncatedListView(tableItemsUIProps),
  },
  {
    field: 'reserved',
    name: 'Customization',
    render: (reserved: boolean) => {
      return renderCustomization(reserved, tableItemsUIProps);
    },
  },
];

export function RoleList(props: AppDependencies) {
  const [roleData, setRoleData] = React.useState<RoleListing[]>([]);
  const [errorFlag, setErrorFlag] = React.useState(false);
  const [selection, setSelection] = React.useState<RoleListing[]>([]);
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const rawRoleData = await fetchRole(props.coreStart.http);
        const rawRoleMappingData = await fetchRoleMapping(props.coreStart.http);
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
      closeActionsMenu();
    }
  };

  const [showDeleteConfirmModal, deleteConfirmModal] = useDeleteConfirmState(
    handleDelete,
    'role(s)'
  );

  const actionsMenuItems = [
    <EuiButtonEmpty
      data-test-subj="edit"
      key="edit"
      onClick={() => {
        window.location.href = buildHashUrl(ResourceType.roles, Action.edit, selection[0].roleName);
      }}
      disabled={selection.length !== 1 || selection[0].reserved}
    >
      Edit
    </EuiButtonEmpty>,
    // TODO: Change duplication to a popup window
    <EuiButtonEmpty
      data-test-subj="duplicate"
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
    </EuiButtonEmpty>,
    <EuiButtonEmpty
      key="delete"
      color="danger"
      onClick={showDeleteConfirmModal}
      disabled={selection.length === 0 || selection.some((e) => e.reserved)}
    >
      Delete
    </EuiButtonEmpty>,
  ];

  const [actionsMenu, closeActionsMenu] = useContextMenuState('Actions', {}, actionsMenuItems);

  const [searchOptions, setSearchOptions] = useState<EuiSearchBarProps>({});
  const [query, setQuery] = useState<Query | null>(null);
  useEffect(() => {
    setSearchOptions({
      onChange: (arg) => {
        setQuery(arg.query);
        return true;
      },
      filters: [
        {
          type: 'field_value_selection',
          field: 'clusterPermissions',
          name: 'Cluster permissions',
          multiSelect: 'or',
          options: buildSearchFilterOptions(roleData, 'clusterPermissions'),
        },
        {
          type: 'field_value_selection',
          field: 'indexPermissions',
          name: 'Index permissions',
          multiSelect: 'or',
          options: buildSearchFilterOptions(roleData, 'indexPermissions'),
        },
        {
          type: 'field_value_selection',
          field: 'internalUsers',
          name: 'Internal users',
          multiSelect: 'or',
          options: buildSearchFilterOptions(roleData, 'internalUsers'),
        },
        {
          type: 'field_value_selection',
          field: 'backendRoles',
          name: 'Backend roles',
          multiSelect: 'or',
          options: buildSearchFilterOptions(roleData, 'backendRoles'),
        },
        {
          type: 'field_value_selection',
          field: 'tenantPermissions',
          name: 'Tenants',
          multiSelect: 'or',
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
              view: renderCustomization(true, tableItemsUIProps),
            },
            {
              value: false,
              view: renderCustomization(false, tableItemsUIProps),
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
              <h3>
                Roles
                <span className="panel-header-count">
                  {' '}
                  ({Query.execute(query || '', roleData).length})
                </span>
              </h3>
            </EuiTitle>
            <EuiText size="xs" color="subdued">
              Roles are the core way of controlling access to your cluster. Roles contain any
              combination of cluster-wide permission, index-specific permissions, document- and
              field-level security, and tenants. Then you map users to these roles so that users
              gain those permissions. <ExternalLink href={DocLinks.UsersAndRolesDoc} />
            </EuiText>
          </EuiPageContentHeaderSection>
          <EuiPageContentHeaderSection>
            <EuiFlexGroup>
              <EuiFlexItem>{actionsMenu}</EuiFlexItem>
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
            data-test-subj="role-list"
            tableLayout={'auto'}
            loading={roleData === [] && !errorFlag}
            columns={columns}
            items={roleData}
            itemId={'roleName'}
            pagination={true}
            selection={{ onSelectionChange: setSelection }}
            sorting={true}
            search={searchOptions}
            error={errorFlag ? 'Load data failed, please check console log for more detail.' : ''}
            message={showTableStatusMessage(loading, roleData)}
          />
        </EuiPageBody>
        {deleteConfirmModal}
      </EuiPageContent>
    </>
  );
}
