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

import React from 'react';
import { EuiFormRow, EuiText, EuiTitle } from '@elastic/eui';

interface FormRowDeps {
  headerText: string;
  headerSubText?: string;
  helpText?: string;
  children: React.ReactElement;
}

export function FormRow(props: FormRowDeps) {
  return (
    <EuiFormRow fullWidth
      label={
        <EuiText size="xs" color="subdued">
          <EuiTitle size="xxs">
            <h4>{ props.headerText }</h4>
          </EuiTitle>
          { props.headerSubText }
        </EuiText>
      }
      helpText={ props.helpText }
    >
      {props.children}
    </EuiFormRow>
  );
}
