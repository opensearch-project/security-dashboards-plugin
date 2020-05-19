
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

import { ComboBoxOptions } from './types';
import React, { Dispatch, SetStateAction } from 'react';
import { PanelWithHeader } from '../../utils/panel-with-header';
import { EuiForm, EuiFlexGroup, EuiFlexItem, EuiComboBox, EuiButton } from '@elastic/eui';
import { FormRow } from '../../utils/form-row';

export function ClusterPermissionPanel(props: {
  state: ComboBoxOptions;
  optionUniverse: ComboBoxOptions;
  setState: Dispatch<SetStateAction<ComboBoxOptions>>;
}) {
  const {state, optionUniverse, setState} = props;
  return (<PanelWithHeader
    headerText="Cluster permissions"
    headerSubText="Specify how users in this role can access the cluster. By default, no cluster permission is granted."
    helpLink="/"
  >
    <EuiForm>
      <FormRow
        headerText="Cluster Permissions"
        headerSubText="Specify permissions using either action groups or single permissions. An action group is a list of single permissions.
        You can often achieve your desired security posture using some combination of the default permission groups. You can
        also create your own reusable permission groups."
      >
        <EuiFlexGroup>
          <EuiFlexItem style={{ maxWidth: '400px' }}>
            <EuiComboBox
              options={optionUniverse}
              selectedOptions={state}
              onChange={setState}
            />
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiButton>Browse and select</EuiButton>
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiButton iconType="popout" iconSide="right">
              Create new action group
            </EuiButton>
          </EuiFlexItem>
        </EuiFlexGroup>
      </FormRow>
    </EuiForm>
  </PanelWithHeader>)
}
