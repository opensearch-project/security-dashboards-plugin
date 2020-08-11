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

import React from 'react';
import { PanelWithHeader } from '../../utils/panel-with-header';
import { PermissionTree } from '../permission-tree';
import { ActionGroupItem, DataObject } from '../../types';

export function ClusterPermissionPanel(props: {
  clusterPermissions: string[];
  actionGroups: DataObject<ActionGroupItem>;
}) {
  const headerText = 'Cluster permissions (' + props.clusterPermissions.length + ')';

  return (
    <PanelWithHeader
      headerText={headerText}
      headerSubText="Cluster permissions specify how users in this role can access the cluster. You can
      specify permissions using both action groups or single permissions. An action
      group is a list of single permissions."
      helpLink="/"
    >
      <PermissionTree permissions={props.clusterPermissions} actionGroups={props.actionGroups} />
    </PanelWithHeader>
  );
}
