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
  EuiComboBox,
} from '@elastic/eui';
import React, { useState } from 'react';
import { ComboBoxOptions, Action } from '../../types';
import {
  stringToComboBoxOption,
  comboBoxOptionToString,
  appendOptionToComboBoxHandler,
} from '../../utils/combo-box-utils';
import { FormRow } from '../../utils/form-row';
import { NameRow } from '../../utils/name-row';

interface PermissionEditModalDeps {
  groupName: string;
  action: Action;
  allowedActions: string[];
  optionUniverse: ComboBoxOptions;
  handleClose: () => void;
  handleSave: (groupName: string, allowedActions: string[]) => Promise<void>;
}

const TITLE_DICT: { [key: string]: string } = {
  [Action.create]: 'Create new action group',
  [Action.edit]: 'Edit action group',
  [Action.duplicate]: 'Duplicate action group',
};

export function PermissionEditModal(props: PermissionEditModalDeps) {
  const [groupName, setGroupName] = useState<string>(props.groupName);
  const [allowedActions, setAllowedActions] = useState<ComboBoxOptions>(
    props.allowedActions.map(stringToComboBoxOption)
  );
  const [isFormValid, setIsFormValid] = useState<boolean>(true);

  return (
    <EuiOverlayMask>
      <EuiModal onClose={props.handleClose}>
        <EuiModalHeader>
          <EuiModalHeaderTitle>{TITLE_DICT[props.action]}</EuiModalHeaderTitle>
        </EuiModalHeader>

        <EuiModalBody>
          <EuiForm>
            <NameRow
              headerText="Name"
              headerSubText="Enter a unique name to describe the purpose of this group. You cannot change the name after creation."
              resourceName={groupName}
              resourceType=""
              action={props.action}
              setNameState={setGroupName}
              setIsFormValid={setIsFormValid}
            />
            <FormRow headerText="Permissions">
              <EuiComboBox
                options={props.optionUniverse}
                selectedOptions={allowedActions}
                onCreateOption={appendOptionToComboBoxHandler(setAllowedActions, [])}
                onChange={setAllowedActions}
              />
            </FormRow>
          </EuiForm>
        </EuiModalBody>

        <EuiModalFooter>
          <EuiButtonEmpty onClick={props.handleClose}>Cancel</EuiButtonEmpty>

          <EuiButton
            id="submit"
            onClick={async () => {
              await props.handleSave(groupName, allowedActions.map(comboBoxOptionToString));
            }}
            fill
            disabled={!isFormValid}
          >
            {props.action === Action.create ? 'Create' : 'Save'}
          </EuiButton>
        </EuiModalFooter>
      </EuiModal>
    </EuiOverlayMask>
  );
}
