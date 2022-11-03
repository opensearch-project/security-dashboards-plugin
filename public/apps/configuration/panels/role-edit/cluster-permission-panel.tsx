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

import React, { Dispatch, SetStateAction } from 'react';
import { EuiForm, EuiFlexGroup, EuiFlexItem, EuiComboBox } from '@elastic/eui';
import { ComboBoxOptions, ResourceType } from '../../types';
import { PanelWithHeader } from '../../utils/panel-with-header';
import { FormRow } from '../../utils/form-row';
import { LIMIT_WIDTH_INPUT_CLASS } from '../../constants';
import { ExternalLinkButton } from '../../utils/display-utils';
import { buildHashUrl } from '../../utils/url-builder';
import { DocLinks } from '../../constants';

export function ClusterPermissionPanel(props: {
  state: ComboBoxOptions;
  optionUniverse: ComboBoxOptions;
  setState: Dispatch<SetStateAction<ComboBoxOptions>>;
}) {
  const { state, optionUniverse, setState } = props;
  return (
    <PanelWithHeader
      headerText="Cluster permissions"
      headerSubText="Specify how users in this role can access the cluster. By default, no cluster permission is granted."
      helpLink={DocLinks.ClusterPermissionsDoc}
    >
      <EuiForm>
        <FormRow
          headerText="Cluster Permissions"
          headerSubText="Specify permissions using either action groups or single permissions. An action group is a list of single permissions.
        You can often achieve your desired security posture using some combination of the default permission groups. You can
        also create your own reusable permission groups."
        >
          <EuiFlexGroup>
            <EuiFlexItem className={LIMIT_WIDTH_INPUT_CLASS}>
              <EuiComboBox
                placeholder="Search for action group name or permission name"
                options={optionUniverse}
                selectedOptions={state}
                onChange={setState}
                id="roles-cluster-permission-box"
              />
            </EuiFlexItem>
            {/* TODO: 'Browse and select' button with a pop-up modal for selection */}
            <EuiFlexItem grow={false}>
              <ExternalLinkButton
                href={buildHashUrl(ResourceType.permissions)}
                text="Create new permission group"
              />
            </EuiFlexItem>
          </EuiFlexGroup>
        </FormRow>
      </EuiForm>
    </PanelWithHeader>
  );
}
