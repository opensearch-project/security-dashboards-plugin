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
  EuiTextArea,
  EuiHorizontalRule,
} from '@elastic/eui';
import React, { useState } from 'react';
import { Action } from '../../types';
import { FormRow } from '../../utils/form-row';
import { NameRow } from '../../utils/name-row';

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
  const [tenantDescription, setTenantDescription] = React.useState<string>(props.tenantDescription);

  const [isFormValid, setIsFormValid] = useState<boolean>(true);

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
            <NameRow
              headerText="Name"
              headerSubText="Specify a descriptive and unique tenant name that is easy to recognize. You cannot edit the name once the tenant is created."
              resourceName={tenantName}
              resourceType="tenant"
              action={props.action}
              setNameState={setTenantName}
              setIsFormValid={setIsFormValid}
              fullWidth={true}
            />
            <FormRow
              headerText="Description"
              headerSubText="Describe the purpose of the tenant."
              optional
            >
              <EuiTextArea
                data-test-subj="tenant-description"
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
            disabled={!isFormValid}
          >
            {props.action === Action.create ? 'Create' : 'Save'}
          </EuiButton>
        </EuiModalFooter>
      </EuiModal>
    </EuiOverlayMask>
  );
}
