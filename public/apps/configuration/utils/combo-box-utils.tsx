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

import { EuiComboBoxOptionOption } from '@elastic/eui';
import { Dispatch, SetStateAction } from 'react';
import { PropertyName, curry } from 'lodash';
import { appendElementToArray } from './array-state-utils';

// Build an option object for EuiComboBox
export function stringToComboBoxOption(option: string): EuiComboBoxOptionOption {
  return { label: option };
}

// Unbuild an EuiComboBox option objects to string
export function comboBoxOptionToString(option: EuiComboBoxOptionOption): string {
  return option.label;
}

/**
 * Convert a string to a combo box option and append to an array (or sub array indicating by path)
 * @param setStateCallback setState function
 * @param path lodash path, e.g. [0, indexPattern] or "[0].indexPattern", use [] to indicate root level
 * @param newValue value to be updated
 *
 * e.g.
 * Scenario 1, path = [] to append to root level array
 *  currentState = [{label: 1}, {label: 2}]
 *  path = []
 *  newValue = 3
 * The newState will be [{label: 1}, {label: 2}, {label: 3}]
 *
 * Scenario 2, path != [] to append to sub array
 *  currentState = [
 *    {options: [{label: 1}, {label: 2}]},
 *    {options: [{label: 3}, {label: 4}]}
 *  ]
 *  path = [0, 'options']
 *  newValue = 5
 * The newState will be [
 *    {options: [{label: 1}, {label: 2}, {label: 5}]},
 *    {options: [{label: 3}, {label: 4}]}
 * ]
 */
export function appendOptionToComboBox(
  setStateFunc: Dispatch<SetStateAction<any[]>>,
  path: PropertyName | PropertyName[],
  newValue: string
) {
  appendElementToArray(setStateFunc, path, { label: newValue });
}

export const appendOptionToComboBoxHandler = curry(appendOptionToComboBox);
