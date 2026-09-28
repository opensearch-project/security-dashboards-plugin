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

import React from 'react';
import { EuiCompressedFieldText } from '@elastic/eui';
import { FormRow } from './form-row';
import { resourceNameHelpText, validateResourceName } from './resource-validation-util';
import { FormRowDeps } from '../types';
import { MAX_INPUT_LENGTH } from '../../../../common';

export interface NameRowDeps extends FormRowDeps {
  resourceName: string;
  resourceType: string;
  action: string;
  fullWidth?: boolean;
  setNameState: (value: React.SetStateAction<string>) => void;
  setIsFormValid: (value: React.SetStateAction<boolean>) => void;
}

export function NameRow(props: NameRowDeps) {
  const [errors, setErrors] = React.useState<string[]>([]);

  // Validate the value we are handed rather than props.resourceName. The prop
  // carries whatever the last committed render held, so a blur that arrives
  // before React has applied the latest keystroke would validate a stale name.
  const validateName = (resourceName: string) => {
    const errorMessages = validateResourceName(props.resourceType, resourceName);
    props.setIsFormValid(!(errorMessages.length > 0));
    setErrors(errorMessages);
  };

  return (
    <FormRow
      headerText={props.headerText}
      headerSubText={props.headerSubText}
      helpText={resourceNameHelpText(props.resourceType)}
      isInvalid={errors.length > 0}
      error={errors}
    >
      <EuiCompressedFieldText
        data-test-subj="name-text"
        fullWidth={props.fullWidth}
        value={props.resourceName}
        maxLength={MAX_INPUT_LENGTH}
        onChange={(e) => {
          props.setNameState(e.target.value);
          // Once the field has been flagged, re-check as the user types so the
          // error and the disabled submit button clear again when the name
          // becomes valid. Only an already-invalid field is re-validated, so a
          // half-typed name is never flagged mid-entry.
          if (errors.length > 0) {
            validateName(e.target.value);
          }
        }}
        onBlur={(e) => {
          validateName(e.target.value);
        }}
        disabled={props.action === 'edit'}
        isInvalid={errors.length > 0}
      />
    </FormRow>
  );
}
