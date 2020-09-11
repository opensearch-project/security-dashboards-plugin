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
  EuiBasicTableColumn,
  EuiButtonIcon,
  EuiFlexGroup,
  EuiFlexItem,
  EuiGlobalToastList,
  EuiIcon,
  EuiInMemoryTable,
  EuiPageBody,
  EuiPageContent,
  EuiPageContentHeader,
  EuiPageContentHeaderSection,
  EuiPageHeader,
  EuiSearchBarProps,
  EuiText,
  EuiTitle,
  RIGHT_ALIGNMENT,
  EuiButtonEmpty,
} from '@elastic/eui';
import { difference } from 'lodash';
import React, {
  Dispatch,
  ReactNode,
  SetStateAction,
  useCallback,
  useEffect,
  useState,
} from 'react';
import { AppDependencies } from '../../../types';
import { Action, DataObject, ActionGroupItem, ExpandedRowMapInterface } from '../../types';
import {
  PermissionListingItem,
  requestDeleteActionGroups,
  updateActionGroup,
  fetchActionGroups,
  mergeAllPermissions,
} from '../../utils/action-groups-utils';
import { stringToComboBoxOption } from '../../utils/combo-box-utils';
import { ExternalLink, renderCustomization } from '../../utils/display-utils';
import { useToastState } from '../../utils/toast-utils';
import { PermissionEditModal } from './edit-modal';
import { PermissionTree } from '../permission-tree';
import { showTableStatusMessage } from '../../utils/loading-spinner-utils';
import { useDeleteConfirmState } from '../../utils/delete-confirm-modal-utils';
import { useContextMenuState } from '../../utils/context-menu';
import { generateResourceName } from '../../utils/resource-utils';

function renderBooleanToCheckMark(value: boolean): React.ReactNode {
  return value ? <EuiIcon type="check" /> : '';
}

function toggleRowDetails(
  item: PermissionListingItem,
  actionGroupDict: DataObject<ActionGroupItem>,
  setItemIdToExpandedRowMap: Dispatch<SetStateAction<ExpandedRowMapInterface>>
) {
  setItemIdToExpandedRowMap((prevState) => {
    const itemIdToExpandedRowMapValues = { ...prevState };
    if (itemIdToExpandedRowMapValues[item.name]) {
      delete itemIdToExpandedRowMapValues[item.name];
    } else {
      itemIdToExpandedRowMapValues[item.name] = (
        <PermissionTree permissions={item.allowedActions} actionGroups={actionGroupDict} />
      );
    }
    return itemIdToExpandedRowMapValues;
  });
}

function getColumns(
  itemIdToExpandedRowMap: ExpandedRowMapInterface,
  actionGroupDict: DataObject<ActionGroupItem>,
  setItemIdToExpandedRowMap: Dispatch<SetStateAction<ExpandedRowMapInterface>>
): Array<EuiBasicTableColumn<PermissionListingItem>> {
  return [
    {
      field: 'name',
      name: 'Name',
      sortable: true,
    },
    {
      field: 'type',
      name: 'Type',
      sortable: true,
    },
    {
      field: 'hasClusterPermission',
      name: 'Cluster permission',
      render: renderBooleanToCheckMark,
    },
    {
      field: 'hasIndexPermission',
      name: 'Index permission',
      render: renderBooleanToCheckMark,
    },
    {
      field: 'reserved',
      name: 'Customization',
      render: renderCustomization,
    },
    {
      align: RIGHT_ALIGNMENT,
      width: '40px',
      isExpander: true,
      render: (item: PermissionListingItem) =>
        item.type === 'Action group' && (
          <EuiButtonIcon
            onClick={() => toggleRowDetails(item, actionGroupDict, setItemIdToExpandedRowMap)}
            aria-label={itemIdToExpandedRowMap[item.name] ? 'Collapse' : 'Expand'}
            iconType={itemIdToExpandedRowMap[item.name] ? 'arrowUp' : 'arrowDown'}
          />
        ),
    },
  ];
}

const SEARCH_OPTIONS: EuiSearchBarProps = {
  box: { placeholder: 'Search for action group name or permission name' },
  filters: [
    {
      type: 'field_value_selection',
      field: 'type',
      name: 'All types',
      options: [{ value: 'Action group' }, { value: 'Single permission' }],
    },
    {
      type: 'field_value_selection',
      name: 'All permissions',
      options: [
        { field: 'hasClusterPermission', name: 'Cluster permissions', value: true },
        { field: 'hasIndexPermission', name: 'Index permissions', value: true },
      ],
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
};

function getSuccessToastMessage(action: string, groupName: string): string {
  switch (action) {
    case 'create':
    case 'duplicate':
      return `Action group "${groupName}" successfully created`;
    case 'edit':
      return `Action group "${groupName}" successfully updated`;
    default:
      return '';
  }
}

export function PermissionList(props: AppDependencies) {
  const [permissionList, setPermissionList] = useState<PermissionListingItem[]>([]);
  const [actionGroupDict, setActionGroupDict] = useState<DataObject<ActionGroupItem>>({});
  const [errorFlag, setErrorFlag] = useState<boolean>(false);
  const [selection, setSelection] = useState<PermissionListingItem[]>([]);
  const [itemIdToExpandedRowMap, setItemIdToExpandedRowMap] = useState<ExpandedRowMapInterface>({});

  // Modal state
  const [editModal, setEditModal] = useState<ReactNode>(null);

  const [toasts, addToast, removeToast] = useToastState();

  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const actionGroups = await fetchActionGroups(props.coreStart.http);
      setActionGroupDict(actionGroups);
      setPermissionList(await mergeAllPermissions(actionGroups));
    } catch (e) {
      console.log(e);
      setErrorFlag(true);
    } finally {
      setLoading(false);
    }
  }, [props.coreStart.http]);

  useEffect(() => {
    fetchData();
  }, [props.coreStart.http, fetchData]);

  const handleDelete = async () => {
    const groupsToDelete: string[] = selection.map((r) => r.name);
    try {
      await requestDeleteActionGroups(props.coreStart.http, groupsToDelete);
      setPermissionList(difference(permissionList, selection));
      setSelection([]);
    } catch (e) {
      console.log(e);
    } finally {
      closeActionsMenu();
    }
  };

  const [showDeleteConfirmModal, deleteConfirmModal] = useDeleteConfirmState(
    handleDelete,
    'action group(s)'
  );

  const actionsMenuItems = [
    <EuiButtonEmpty
      key="edit"
      onClick={() => showEditModal(selection[0].name, Action.edit, selection[0].allowedActions)}
      disabled={selection.length !== 1 || selection[0].reserved}
    >
      Edit
    </EuiButtonEmpty>,
    <EuiButtonEmpty
      key="duplicate"
      onClick={() =>
        showEditModal(
          generateResourceName(Action.duplicate, selection[0].name),
          Action.duplicate,
          selection[0].allowedActions
        )
      }
      disabled={selection.length !== 1 || selection[0].type !== 'Action group'}
    >
      Duplicate
    </EuiButtonEmpty>,
    <EuiButtonEmpty
      key="delete"
      color="danger"
      onClick={showDeleteConfirmModal}
      disabled={selection.length === 0 || selection.some((group) => group.reserved)}
    >
      Delete
    </EuiButtonEmpty>,
  ];

  const [actionsMenu, closeActionsMenu] = useContextMenuState('Actions', {}, actionsMenuItems);

  const showEditModal = (
    initialGroupName: string,
    action: Action,
    initialAllowedAction: string[]
  ) => {
    setEditModal(
      <PermissionEditModal
        groupName={initialGroupName}
        action={action}
        allowedActions={initialAllowedAction}
        optionUniverse={permissionList.map((group) => stringToComboBoxOption(group.name))}
        handleClose={() => setEditModal(null)}
        handleSave={async (groupName, allowedAction) => {
          try {
            await updateActionGroup(props.coreStart.http, groupName, {
              allowed_actions: allowedAction,
            });
            setEditModal(null);
            fetchData();
            addToast({
              id: 'saveSucceeded',
              title: getSuccessToastMessage(action, groupName),
              color: 'success',
            });
          } catch (e) {
            console.log(e);
            setEditModal(null);
            addToast({
              id: 'saveFailed',
              title: `Failed to save ${action} group. You may refresh the page to retry or see browser console for more information.`,
              color: 'danger',
            });
          }
        }}
      />
    );
  };

  const createActionGroupMenuItems = [
    <EuiButtonEmpty key="create-from-blank" onClick={() => showEditModal('', Action.create, [])}>
      Create from blank
    </EuiButtonEmpty>,
    <EuiButtonEmpty
      key="create-from-selection"
      onClick={() =>
        showEditModal(
          '',
          Action.create,
          selection.map((item) => item.name)
        )
      }
      disabled={selection.length === 0}
    >
      Create from selection
    </EuiButtonEmpty>,
  ];

  const [createActionGroupMenu, closeCreateActionGroupMenu] = useContextMenuState(
    'Create action group',
    { fill: true },
    createActionGroupMenuItems
  );

  return (
    <>
      <EuiPageHeader>
        <EuiTitle size="l">
          <h1>Permissions</h1>
        </EuiTitle>
      </EuiPageHeader>
      <EuiPageContent>
        <EuiPageContentHeader>
          <EuiPageContentHeaderSection>
            <EuiTitle size="s">
              <h3>
                Permissions
                <span className="panel-header-count"> ({permissionList.length})</span>
              </h3>
            </EuiTitle>
            <EuiText size="xs" color="subdued">
              Permissions define the type of access to the cluster or the specified indices. An
              action group is a set of predefined single permissions and/or another set of action
              groups. You can often achieve your desired security posture using some combination of
              the default action groups. Or you can create your own group. <ExternalLink href="/" />
            </EuiText>
          </EuiPageContentHeaderSection>
          <EuiPageContentHeaderSection>
            <EuiFlexGroup>
              <EuiFlexItem>{actionsMenu}</EuiFlexItem>
              <EuiFlexItem>{createActionGroupMenu}</EuiFlexItem>
            </EuiFlexGroup>
          </EuiPageContentHeaderSection>
        </EuiPageContentHeader>
        <EuiPageBody>
          <EuiInMemoryTable
            tableLayout={'auto'}
            loading={permissionList === [] && !errorFlag}
            columns={getColumns(itemIdToExpandedRowMap, actionGroupDict, setItemIdToExpandedRowMap)}
            items={permissionList}
            itemId={'name'}
            pagination
            search={SEARCH_OPTIONS}
            selection={{ onSelectionChange: setSelection }}
            sorting={{ sort: { field: 'type', direction: 'asc' } }}
            error={errorFlag ? 'Load data failed, please check console log for more detail.' : ''}
            isExpandable={true}
            itemIdToExpandedRowMap={itemIdToExpandedRowMap}
            message={showTableStatusMessage(loading, permissionList)}
          />
        </EuiPageBody>
      </EuiPageContent>
      {editModal}
      {deleteConfirmModal}
      <EuiGlobalToastList toasts={toasts} toastLifeTimeMs={10000} dismissToast={removeToast} />
    </>
  );
}
