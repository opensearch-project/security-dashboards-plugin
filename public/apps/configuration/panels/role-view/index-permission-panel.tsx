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

import React, { useState, Dispatch, SetStateAction } from 'react';
import {
  EuiInMemoryTable,
  EuiBasicTableColumn,
  RIGHT_ALIGNMENT,
  EuiButtonIcon,
  EuiText,
  EuiFlexGroup,
  EuiEmptyPrompt,
  EuiButton,
} from '@elastic/eui';
import { PanelWithHeader } from '../../utils/panel-with-header';
import {
  DataObject,
  ActionGroupItem,
  ExpandedRowMapInterface,
  RoleIndexPermissionView,
  ResourceType,
  Action,
} from '../../types';
import { truncatedListView, displayArray, tableItemsUIProps } from '../../utils/display-utils';
import { PermissionTree } from '../permission-tree';
import { getFieldLevelSecurityMethod } from '../../utils/index-permission-utils';
import { renderExpression, displayHeaderWithTooltip } from '../../utils/display-utils';
import { DocLinks, ToolTipContent } from '../../constants';
import { showTableStatusMessage } from '../../utils/loading-spinner-utils';
import { buildHashUrl } from '../../utils/url-builder';
import { EMPTY_FIELD_VALUE } from '../../ui-constants';

export function toggleRowDetails(
  item: RoleIndexPermissionView,
  actionGroupDict: DataObject<ActionGroupItem>,
  setItemIdToExpandedRowMap: Dispatch<SetStateAction<ExpandedRowMapInterface>>
) {
  setItemIdToExpandedRowMap((prevState) => {
    const itemIdToExpandedRowMapValues = { ...prevState };
    if (itemIdToExpandedRowMapValues[item.id]) {
      delete itemIdToExpandedRowMapValues[item.id];
    } else {
      itemIdToExpandedRowMapValues[item.id] = (
        <PermissionTree permissions={item.allowed_actions} actionGroups={actionGroupDict} />
      );
    }
    return itemIdToExpandedRowMapValues;
  });
}

export function renderRowExpanstionArrow(
  itemIdToExpandedRowMap: ExpandedRowMapInterface,
  actionGroupDict: DataObject<ActionGroupItem>,
  setItemIdToExpandedRowMap: Dispatch<SetStateAction<ExpandedRowMapInterface>>
) {
  return (item: RoleIndexPermissionView) => (
    <EuiButtonIcon
      onClick={() => toggleRowDetails(item, actionGroupDict, setItemIdToExpandedRowMap)}
      aria-label={itemIdToExpandedRowMap[item.id] ? 'Collapse' : 'Expand'}
      iconType={itemIdToExpandedRowMap[item.id] ? 'arrowUp' : 'arrowDown'}
    />
  );
}

export function renderFieldLevelSecurity() {
  return (items: string[]) => {
    // Show - to indicate empty
    if (items === undefined || items.length === 0) {
      return (
        <EuiFlexGroup direction="column" style={{ margin: '1px' }}>
          <EuiText
            data-test-subj="empty-fls-text"
            key={'-'}
            className={tableItemsUIProps.cssClassName}
          >
            {EMPTY_FIELD_VALUE}
          </EuiText>
        </EuiFlexGroup>
      );
    }

    return (
      <EuiFlexGroup direction="column" style={{ margin: '1px' }}>
        <EuiText data-test-subj="fls-text" className={tableItemsUIProps.cssClassName}>
          {getFieldLevelSecurityMethod(items) === 'exclude' ? 'Exclude' : 'Include'}:{' '}
          {displayArray(items.map((s: string) => s.replace(/^~/, '')))}
        </EuiText>
      </EuiFlexGroup>
    );
  };
}

export function renderDocumentLevelSecurity() {
  return (dls: string) => {
    if (!dls) {
      return EMPTY_FIELD_VALUE;
    }

    // TODO: unify the experience for both cases which may require refactoring of renderExpression.
    try {
      return renderExpression('Document-level security', JSON.parse(dls));
    } catch (e) {
      // Support the use case for $variable without double quotes in DLS, e.g. variable is an array.

      console.warn('Failed to parse dls as json!');
      return dls;
    }
  };
}

function getColumns(
  itemIdToExpandedRowMap: ExpandedRowMapInterface,
  actionGroupDict: DataObject<ActionGroupItem>,
  setItemIdToExpandedRowMap: Dispatch<SetStateAction<ExpandedRowMapInterface>>
): Array<EuiBasicTableColumn<RoleIndexPermissionView>> {
  return [
    {
      field: 'index_patterns',
      name: 'Index',
      sortable: true,
      render: truncatedListView(tableItemsUIProps),
      truncateText: true,
    },
    {
      field: 'allowed_actions',
      name: 'Permissions',
      render: truncatedListView(tableItemsUIProps),
      truncateText: true,
    },
    {
      field: 'dls',
      name: displayHeaderWithTooltip(
        'Document-level security',
        ToolTipContent.DocumentLevelSecurity
      ),
      render: renderDocumentLevelSecurity(),
    },
    {
      field: 'fls',
      name: displayHeaderWithTooltip('Field-level security', ToolTipContent.FieldLevelSecurity),
      render: renderFieldLevelSecurity(),
    },
    {
      field: 'masked_fields',
      name: 'Anonymizations',
      render: truncatedListView(tableItemsUIProps),
      truncateText: true,
    },
    {
      align: RIGHT_ALIGNMENT,
      width: '40px',
      isExpander: true,
      render: renderRowExpanstionArrow(
        itemIdToExpandedRowMap,
        actionGroupDict,
        setItemIdToExpandedRowMap
      ),
    },
  ];
}

interface IndexPermissionPanelProps {
  roleName: string;
  indexPermissions: RoleIndexPermissionView[];
  actionGroups: DataObject<ActionGroupItem>;
  errorFlag: boolean;
  loading: boolean;
  isReserved: boolean;
}

export function IndexPermissionPanel(props: IndexPermissionPanelProps) {
  const [itemIdToExpandedRowMap, setItemIdToExpandedRowMap] = useState<ExpandedRowMapInterface>({});

  const emptyListMessage = (
    <EuiEmptyPrompt
      title={<h3>No index permission</h3>}
      titleSize="s"
      actions={
        <EuiButton
          data-test-subj="addIndexPermission"
          disabled={props.isReserved}
          onClick={() => {
            window.location.href = buildHashUrl(ResourceType.roles, Action.edit, props.roleName);
          }}
        >
          Add index permission
        </EuiButton>
      }
    />
  );

  const headerText = 'Index permissions';
  return (
    <PanelWithHeader
      headerText={headerText}
      headerSubText="Index permissions allow you to specify how users in this role can access the indices. You can restrict a role to a subset of documents in an index,
      and which document fields a user can see as well. If you use field-level security in conjunction with document-level security,
      make sure you don't restrict access to the fields that document-level security uses."
      helpLink={DocLinks.IndexPermissionsDoc}
      count={props.indexPermissions.length}
    >
      <EuiInMemoryTable
        data-test-subj="index-permission-container"
        tableLayout={'auto'}
        loading={props.indexPermissions === [] && !props.errorFlag}
        columns={getColumns(itemIdToExpandedRowMap, props.actionGroups, setItemIdToExpandedRowMap)}
        items={props.indexPermissions}
        itemId={'id'}
        sorting={{ sort: { field: 'type', direction: 'asc' } }}
        error={props.errorFlag ? 'Load data failed, please check console log for more detail.' : ''}
        isExpandable={true}
        itemIdToExpandedRowMap={itemIdToExpandedRowMap}
        message={showTableStatusMessage(props.loading, props.indexPermissions, emptyListMessage)}
      />
    </PanelWithHeader>
  );
}
