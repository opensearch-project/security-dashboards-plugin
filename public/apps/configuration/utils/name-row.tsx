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

import React, { useState } from 'react';
import { EuiFieldText } from '@elastic/eui';
import { FormRow } from './form-row';
import { resourceNameHelpText, validateResourceName } from './resource-validation-util';
import { FormRowDeps } from '../types';

export interface NameRowDeps extends FormRowDeps {
  resourceName: string;
  resourceType: string;
  action: string;
  fullWidth?: boolean;
  setNameState: (value: React.SetStateAction<string>) => void;
  setIsFormValid: (value: React.SetStateAction<boolean>) => void;
}

export function NameRow(props: NameRowDeps) {
  const [errors, setErrors] = useState<string[]>([]);

  const validateName = () => {
    setErrors(validateResourceName(props.resourceType, props.resourceName));
    const errorMessages = validateResourceName(props.resourceType, props.resourceName);
    if (errorMessages.length > 0) {
      props.setIsFormValid(false);
      setErrors(errorMessages);
    } else {
      props.setIsFormValid(true);
      setErrors([]);
    }
  };

  return (
    <FormRow
      headerText={props.headerText}
      headerSubText={props.headerSubText}
      helpText={resourceNameHelpText(props.resourceType)}
      isInvalid={errors.length > 0}
      error={errors}
    >
      <EuiFieldText
        fullWidth={props.fullWidth}
        value={props.resourceName}
        onChange={(e) => {
          props.setNameState(e.target.value);
        }}
        onBlur={() => {
          validateName();
        }}
        disabled={props.action === 'edit'}
        isInvalid={errors.length > 0}
      />
    </FormRow>
  );
}
