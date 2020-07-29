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

import React, { Dispatch, SetStateAction } from 'react';
import { EuiForm, EuiFlexGroup, EuiFlexItem, EuiComboBox, EuiButton } from '@elastic/eui';
import { ComboBoxOptions } from './types';
import { PanelWithHeader } from '../../utils/panel-with-header';
import { FormRow } from '../../utils/form-row';
import { buildHashUrl } from '../../utils/url-builder';
import { ResourceType, Action } from '../../types';

export function InternalUsersPanel(props: {
  state: ComboBoxOptions;
  optionUniverse: ComboBoxOptions;
  setState: Dispatch<SetStateAction<ComboBoxOptions>>;
}) {
  const { state, optionUniverse, setState } = props;
  return (
    <PanelWithHeader
      headerText="Internal users"
      headerSubText="You can create an internal user in internal user database of the security plugin. An
      internal user can have its own backend role and host for an external authentication and
      authorization."
      helpLink="/"
    >
      <EuiForm>
        <FormRow
          headerText="Internal users"
          helpText="Look up by user name. You can also create new internal user."
        >
          <EuiFlexGroup>
            <EuiFlexItem style={{ maxWidth: '400px' }}>
              <EuiComboBox options={optionUniverse} selectedOptions={state} onChange={setState} />
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <EuiButton
                iconType="popout"
                iconSide="right"
                onClick={() => {
                  window.location.href = buildHashUrl(ResourceType.users, Action.create);
                }}
              >
                Create new internal user
              </EuiButton>
            </EuiFlexItem>
          </EuiFlexGroup>
        </FormRow>
      </EuiForm>
    </PanelWithHeader>
  );
}
