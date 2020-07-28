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
  EuiButtonEmpty,
  EuiModal,
  EuiModalBody,
  EuiModalFooter,
  EuiModalHeader,
  EuiModalHeaderTitle,
  EuiOverlayMask,
  EuiForm,
  EuiFieldText,
  EuiComboBox,
} from '@elastic/eui';
import React, { useState } from 'react';
import { ComboBoxOptions, Action } from '../../types';
import { stringToComboBoxOption, comboBoxOptionToString } from '../../utils/combo-box-utils';
import { FormRow } from '../../utils/form-row';

interface PermissionEditModalDeps {
  groupName: string;
  action: Action;
  allowedActions: string[];
  optionUniverse: ComboBoxOptions;
  handleClose: () => void;
  handleSave: (groupName: string, allowedActions: string[]) => Promise<void>;
}

export function PermissionEditModal(props: PermissionEditModalDeps) {
  const [groupName, setGroupName] = useState<string>(props.groupName);
  const [allowedActions, setAllowedActions] = useState<ComboBoxOptions>(
    props.allowedActions.map(stringToComboBoxOption)
  );

  const handleGroupNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    if (newValue.length <= 50) {
      setGroupName(newValue);
    }
  };

  return (
    <EuiOverlayMask>
      <EuiModal onClose={props.handleClose}>
        <EuiModalHeader>
          <EuiModalHeaderTitle>Create new action group</EuiModalHeaderTitle>
        </EuiModalHeader>

        <EuiModalBody>
          <EuiForm>
            <FormRow
              headerText="Name"
              headerSubText="Enter a unique name to describe the purpose of this group. You cannot change the name after creation"
              helpText="The name must be less than 50 characters."
            >
              <EuiFieldText
                isInvalid={groupName === ''}
                disabled={props.action === 'edit'}
                value={groupName}
                onChange={handleGroupNameChange}
              />
            </FormRow>
            <FormRow headerText="Permissions">
              <EuiComboBox
                options={props.optionUniverse}
                selectedOptions={allowedActions}
                onChange={setAllowedActions}
              />
            </FormRow>
          </EuiForm>
        </EuiModalBody>

        <EuiModalFooter>
          <EuiButtonEmpty onClick={props.handleClose}>Cancel</EuiButtonEmpty>

          <EuiButton
            onClick={async () => {
              await props.handleSave(groupName, allowedActions.map(comboBoxOptionToString));
            }}
            fill
          >
            Save
          </EuiButton>
        </EuiModalFooter>
      </EuiModal>
    </EuiOverlayMask>
  );
}
