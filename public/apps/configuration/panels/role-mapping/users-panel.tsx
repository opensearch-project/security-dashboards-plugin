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
import { EuiForm, EuiFlexGroup, EuiFlexItem, EuiComboBox } from '@elastic/eui';
import { ComboBoxOptions } from '../../types';
import { PanelWithHeader } from '../../utils/panel-with-header';
import { FormRow } from '../../utils/form-row';
import { buildHashUrl } from '../../utils/url-builder';
import { ResourceType, Action } from '../../types';
import { ExternalLinkButton } from '../../utils/display-utils';
import { DocLinks } from '../../constants';
import { appendOptionToComboBoxHandler } from '../../utils/combo-box-utils';

export function InternalUsersPanel(props: {
  state: ComboBoxOptions;
  optionUniverse: ComboBoxOptions;
  setState: Dispatch<SetStateAction<ComboBoxOptions>>;
}) {
  const { state, optionUniverse, setState } = props;
  // TODO: improve UX by adding colors to user name pills to distinguish internal user and external user on field population.
  return (
    <PanelWithHeader
      headerText="Users"
      headerSubText="You can create an internal user in internal user database of the security plugin. An
      internal user can have its own backend role and host for an external authentication and
      authorization. External users from your identity provider are also supported."
      helpLink={DocLinks.CreateUsersDoc}
    >
      <EuiForm>
        <FormRow
          headerText="Users"
          helpText="Look up by user name. You can also create new internal user or enter external user."
        >
          <EuiFlexGroup>
            <EuiFlexItem style={{ maxWidth: '400px' }}>
              <EuiComboBox
                options={optionUniverse}
                selectedOptions={state}
                onChange={setState}
                onCreateOption={appendOptionToComboBoxHandler(setState, [])}
              />
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <ExternalLinkButton
                text="Create new internal user"
                href={buildHashUrl(ResourceType.users, Action.create)}
              />
            </EuiFlexItem>
          </EuiFlexGroup>
        </FormRow>
      </EuiForm>
    </PanelWithHeader>
  );
}
