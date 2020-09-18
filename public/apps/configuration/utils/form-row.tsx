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

import { EuiFormRow, EuiText } from '@elastic/eui';
import React from 'react';
import { ExternalLink } from './display-utils';
import { FormRowDeps } from '../types';

export interface FormRowWithChildComponentDeps extends FormRowDeps {
  isInvalid?: boolean;
  error?: string[];
  children: React.ReactElement;
}

export function FormRow(props: FormRowWithChildComponentDeps) {
  return (
    <EuiFormRow
      fullWidth
      label={
        <>
          <EuiText size="xs">
            <b>{props.headerText}</b>
            <i>{props.optional && ' - optional'}</i>
          </EuiText>
          <EuiText color="subdued" size="xs">
            {props.headerSubText}
            {props.helpLink && (
              <>
                {' '}
                <ExternalLink href={props.helpLink} />
              </>
            )}
          </EuiText>
        </>
      }
      helpText={props.helpText}
      isInvalid={props.isInvalid}
      error={props.error}
    >
      {props.children}
    </EuiFormRow>
  );
}
