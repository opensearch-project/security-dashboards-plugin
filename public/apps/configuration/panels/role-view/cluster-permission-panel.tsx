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
import { EuiEmptyPrompt, EuiButton } from '@elastic/eui';
import { PanelWithHeader } from '../../utils/panel-with-header';
import { PermissionTree } from '../permission-tree';
import { ActionGroupItem, DataObject, ResourceType, Action } from '../../types';
import { buildHashUrl } from '../../utils/url-builder';
import { loadingSpinner } from '../../utils/loading-spinner-utils';
import { DocLinks } from '../../constants';

interface ClusterPermissionPanelProps {
  roleName: string;
  clusterPermissions: string[];
  actionGroups: DataObject<ActionGroupItem>;
  loading: boolean;
  isReserved: boolean;
}

export function ClusterPermissionPanel(props: ClusterPermissionPanelProps) {
  const noClusterPermissions = (
    <EuiEmptyPrompt
      title={<h3>No cluster permission</h3>}
      titleSize="s"
      actions={
        <EuiButton
          data-test-subj="addClusterPermission"
          disabled={props.isReserved}
          onClick={() => {
            window.location.href = buildHashUrl(ResourceType.roles, Action.edit, props.roleName);
          }}
        >
          Add cluster permission
        </EuiButton>
      }
    />
  );

  const headerText = 'Cluster permissions';

  return (
    <PanelWithHeader
      headerText={headerText}
      headerSubText="Cluster permissions specify how users in this role can access the cluster. You can
      specify permissions using both action groups or single permissions. An action
      group is a list of single permissions."
      helpLink={DocLinks.ClusterPermissionsDoc}
      count={props.clusterPermissions.length}
    >
      {props.loading ? (
        <div className="text-center">{loadingSpinner}</div>
      ) : props.clusterPermissions.length === 0 ? (
        noClusterPermissions
      ) : (
        <PermissionTree permissions={props.clusterPermissions} actionGroups={props.actionGroups} />
      )}
    </PanelWithHeader>
  );
}
