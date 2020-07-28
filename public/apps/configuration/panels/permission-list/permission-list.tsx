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
  EuiIcon,
  EuiSearchBarProps,
  EuiButtonIcon,
  RIGHT_ALIGNMENT,
} from '@elastic/eui';
import { difference } from 'lodash';
import React, { useEffect, useState, Dispatch, SetStateAction, ReactNode } from 'react';
import { AppDependencies } from '../../../types';
import { ActionGroupListingItem, getAllPermissionsListing } from '../../utils/action-groups-utils';
import { renderCustomization } from '../../utils/display-utils';
import { requestDeleteUsers } from '../../utils/internal-user-list-utils';
import { PermissionEditModal } from './edit-modal';
import { stringToComboBoxOption } from '../../utils/combo-box-utils';
import { Action } from '../../types';

interface ExpandedRowMapInterface {
  [key: string]: React.ReactNode;
}

function renderBooleanToCheckMark(value: boolean): React.ReactNode {
  return value ? <EuiIcon type="check" /> : '';
}

function toggleRowDetails(
  item: ActionGroupListingItem,
  setItemIdToExpandedRowMap: Dispatch<SetStateAction<ExpandedRowMapInterface>>
) {
  setItemIdToExpandedRowMap((prevState) => {
    const itemIdToExpandedRowMapValues = { ...prevState };
    if (itemIdToExpandedRowMapValues[item.name]) {
      delete itemIdToExpandedRowMapValues[item.name];
    } else {
      // TODO: Replace with treeview
      itemIdToExpandedRowMapValues[item.name] = (
        <ul>
          {item.allowedActions.map((action) => (
            <li>{action}</li>
          ))}
        </ul>
      );
    }
    return itemIdToExpandedRowMapValues;
  });
}

function getColumns(
  itemIdToExpandedRowMap: ExpandedRowMapInterface,
  setItemIdToExpandedRowMap: Dispatch<SetStateAction<ExpandedRowMapInterface>>
) {
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
      render: (item: ActionGroupListingItem) =>
        item.type === 'Action group' && (
          <EuiButtonIcon
            onClick={() => toggleRowDetails(item, setItemIdToExpandedRowMap)}
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

export function PermissionList(props: AppDependencies) {
  const [actionGroups, setActionGroups] = useState<ActionGroupListingItem[]>([]);
  const [errorFlag, setErrorFlag] = useState<boolean>(false);
  const [selection, setSelection] = useState<ActionGroupListingItem[]>([]);
  const [isActionsPopoverOpen, setActionsPopoverOpen] = useState<boolean>(false);
  const [isCreateActionGroupPopoverOpen, setCreateActionGroupPopoverOpen] = useState<boolean>(
    false
  );
  const [itemIdToExpandedRowMap, setItemIdToExpandedRowMap] = useState<ExpandedRowMapInterface>({});

  // Modal state
  const [editModal, setEditModal] = useState<ReactNode>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setActionGroups(await getAllPermissionsListing(props.coreStart.http));
      } catch (e) {
        console.log(e);
        setErrorFlag(true);
      }
    };

    fetchData();
  }, [props.coreStart.http]);

  const handleDelete = async () => {
    const usersToDelete: string[] = selection.map((r) => r.name);
    try {
      await requestDeleteUsers(props.coreStart.http, usersToDelete);
      setActionGroups(difference(actionGroups, selection));
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
      onClick={() => showEditModal(selection[0].name, Action.edit, selection[0].allowedActions)}
      disabled={selection.length !== 1 || selection[0].reserved}
    >
      Edit
    </EuiContextMenuItem>,
    <EuiContextMenuItem
      key="duplicate"
      onClick={() =>
        showEditModal(selection[0].name + '_copy', Action.duplicate, selection[0].allowedActions)
      }
      disabled={selection.length !== 1 || selection[0].type !== 'Action group'}
    >
      Duplicate
    </EuiContextMenuItem>,
    <EuiContextMenuItem key="delete" onClick={handleDelete} disabled={selection.length === 0}>
      Delete
    </EuiContextMenuItem>,
  ];

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
        optionUniverse={actionGroups.map((group) => stringToComboBoxOption(group.name))}
        handleClose={() => setEditModal(null)}
        handleSave={async (groupName, allowedAction) => {
          // TODO: Submit to server
          setEditModal(null);
        }}
      />
    );
  };

  const createActionGroupMenuItems = [
    <EuiContextMenuItem
      key="create-from-blank"
      onClick={() => showEditModal('', Action.create, [])}
    >
      Create from blank
    </EuiContextMenuItem>,
    <EuiContextMenuItem
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
    </EuiContextMenuItem>,
  ];

  const actionsButton = (
    <EuiButton
      iconType="arrowDown"
      iconSide="right"
      onClick={() => {
        setActionsPopoverOpen((prevState) => !prevState);
      }}
    >
      Actions
    </EuiButton>
  );

  const createActionGroupMenuButton = (
    <EuiButton
      iconType="arrowDown"
      iconSide="right"
      onClick={() => {
        setCreateActionGroupPopoverOpen((prevState) => !prevState);
      }}
      fill
    >
      Create action group
    </EuiButton>
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
              <h3>Permissions ({actionGroups.length})</h3>
            </EuiTitle>
            <EuiText size="xs" color="subdued">
              Permissions defines type of access to the cluster or the specified indices. An action
              group is a set of predefined single permissions and/or another set of action groups.
              You can often achieve your desired security posture using some combination of the
              default action groups. Or you can create your own group.{' '}
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
                <EuiPopover
                  id="createActionsGroupMenu"
                  button={createActionGroupMenuButton}
                  isOpen={isCreateActionGroupPopoverOpen}
                  closePopover={() => {
                    setCreateActionGroupPopoverOpen(false);
                  }}
                  panelPaddingSize="s"
                >
                  <EuiContextMenuPanel items={createActionGroupMenuItems} />
                </EuiPopover>
              </EuiFlexItem>
            </EuiFlexGroup>
          </EuiPageContentHeaderSection>
        </EuiPageContentHeader>
        <EuiPageBody>
          <EuiInMemoryTable
            loading={actionGroups === [] && !errorFlag}
            columns={getColumns(itemIdToExpandedRowMap, setItemIdToExpandedRowMap)}
            items={actionGroups}
            itemId={'name'}
            pagination
            search={SEARCH_OPTIONS}
            selection={{ onSelectionChange: setSelection }}
            sorting={{ sort: { field: 'type', direction: 'asc' } }}
            error={errorFlag ? 'Load data failed, please check console log for more detail.' : ''}
            isExpandable={true}
            itemIdToExpandedRowMap={itemIdToExpandedRowMap}
          />
        </EuiPageBody>
      </EuiPageContent>
      {editModal}
    </>
  );
}
