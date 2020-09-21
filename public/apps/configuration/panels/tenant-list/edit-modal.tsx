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
  EuiTextArea,
  EuiHorizontalRule,
} from '@elastic/eui';
import React, { useState } from 'react';
import { Action } from '../../types';
import { FormRow } from '../../utils/form-row';

interface TenantEditModalDeps {
  tenantName: string;
  tenantDescription: string;
  action: Action;
  handleClose: () => void;
  handleSave: (tenantName: string, tenantDescription: string) => Promise<void>;
}

const TITLE_DICT: { [key: string]: string } = {
  [Action.create]: 'Create tenant',
  [Action.edit]: 'Edit tenant',
  [Action.duplicate]: 'Duplicate tenant',
};

export function TenantEditModal(props: TenantEditModalDeps) {
  const [tenantName, setTenantName] = useState<string>(props.tenantName);
  const [tenantDescription, setTenantDescription] = useState<string>(props.tenantDescription);

  const handleTenantNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTenantName(e.target.value);
  };

  const handleTenantDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setTenantDescription(e.target.value);
  };

  return (
    <EuiOverlayMask>
      <EuiModal onClose={props.handleClose}>
        <EuiModalHeader>
          <EuiModalHeaderTitle>{TITLE_DICT[props.action]}</EuiModalHeaderTitle>
        </EuiModalHeader>

        <EuiModalBody>
          <EuiForm>
            <FormRow
              headerText="Name"
              headerSubText="Specify a descriptive and unique tenant name that is easy to recognize. You cannot edit the name once the tenant is created."
              helpText="The tenant name must contain from m to n characters. Valid characters are lowercase a-z, 0-9, and -(hyphen)."
            >
              <EuiFieldText
                fullWidth
                disabled={props.action === 'edit'}
                value={tenantName}
                onChange={handleTenantNameChange}
              />
            </FormRow>
            <FormRow
              headerText="Description"
              headerSubText="Describe the purpose of the tenant."
              optional
            >
              <EuiTextArea
                fullWidth
                placeholder="Describe the tenant"
                value={tenantDescription}
                onChange={handleTenantDescriptionChange}
              />
            </FormRow>
          </EuiForm>
        </EuiModalBody>
        <EuiHorizontalRule margin="xs" />
        <EuiModalFooter>
          <EuiButtonEmpty onClick={props.handleClose}>Cancel</EuiButtonEmpty>

          <EuiButton
            id="submit"
            onClick={async () => {
              await props.handleSave(tenantName, tenantDescription);
            }}
            fill
          >
            {props.action === Action.create ? 'Create' : 'Save'}
          </EuiButton>
        </EuiModalFooter>
      </EuiModal>
    </EuiOverlayMask>
  );
}
