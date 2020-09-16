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

import { EuiTreeView, EuiText } from '@elastic/eui';
import { Node } from '@elastic/eui/src/components/tree_view/tree_view';
import React from 'react';
import { isEmpty } from 'lodash';
import { ActionGroupItem, DataObject } from '../../types';

import './_index.scss';

const MAX_DEPTH = 5;

function buildTreeItem(
  name: string,
  depth: number,
  actionGroups: DataObject<ActionGroupItem>
): Node {
  let children: string[] | null = null;
  if (depth < MAX_DEPTH) children = actionGroups[name]?.allowed_actions;

  return {
    label: name,
    id: name,
    icon: <EuiText size="xs">•</EuiText>,
    children: children?.map((child) => buildTreeItem(child, depth + 1, actionGroups)),
    className: isEmpty(children) ? 'tree-leaf-node' : '',
  };
}

export function PermissionTree(props: {
  permissions: string[];
  actionGroups: DataObject<ActionGroupItem>;
}) {
  return (
    <div className="permission-tree-container">
      <EuiTreeView
        display="compressed"
        aria-label="Permission tree"
        showExpansionArrows
        items={props.permissions.map((permission) =>
          buildTreeItem(permission, 0, props.actionGroups)
        )}
      />
    </div>
  );
}
