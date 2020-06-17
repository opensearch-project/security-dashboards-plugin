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

// TODO: call the util functions from wherever applicable.

import { EuiFlexItem, EuiText } from '@elastic/eui';
import { isEmpty } from 'lodash';

import React from 'react';

export function renderTextFlexItem(header: string, value: string) {
  return (
    <EuiFlexItem>
      <EuiText size="xs">
        <strong>{header}</strong>
        <div>{value}</div>
      </EuiText>
    </EuiFlexItem>
  );
}

export function displayBoolean(bool: boolean) {
  return bool ? 'Enabled' : 'Disabled';
}

export function displayArray(array: string[]) {
  return array?.join(', ') || '--';
}

export function displayObject(object: object) {
  return !isEmpty(object) ? JSON.stringify(object) : '--';
}
