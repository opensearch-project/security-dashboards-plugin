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

import { get, set, curry, PropertyName } from 'lodash';
import { Dispatch, SetStateAction } from 'react';

function resolveValue<T>(value: T | (() => T)) {
  return typeof value === 'function' ? (value as Function)() : value;
}

/**
 * Update an element in an sub array
 * @param setStateCallback setState function
 * @param path lodash path, e.g. [0, indexPattern] or "[0].indexPattern"
 * @param newValue value to be updated
 *
 * e.g.
 *  currentState = [{a: 1}, {a: 2}]
 *  path = [0, 'a']
 *  newValue = 10
 * The newState will be [{a: 10}, {a: 2}]
 */
export function updateElementInArray<T>(
  setStateCallback: Dispatch<SetStateAction<any[]>>,
  path: PropertyName | PropertyName[],
  newValue: T | (() => T)
) {
  setStateCallback((prevState) => {
    const newState = [...prevState];
    set(newState, path, resolveValue(newValue));
    return newState;
  });
}

export const updateElementInArrayHandler = curry(updateElementInArray);

/**
 * Append an element to an array (or sub array indicating by path)
 * @param setStateCallback setState function
 * @param path lodash path, e.g. [0, indexPattern] or "[0].indexPattern", use [] to indicate root level
 * @param newValue value to be updated
 *
 * e.g.
 * Scenario 1, path = [] to append to root level array
 *  currentState = [1, 2]
 *  path = []
 *  newValue = 3
 * The newState will be [1, 2, 3]
 *
 * Scenario 2, path != [] to append to sub array
 *  currentState = [{a: [1, 2]}, {a: [3, 4]}]
 *  path = [0, 'a']
 *  newValue = 5
 * The newState will be [{a: [1, 2, 5]}, {a: [3, 4]}]
 */
export function appendElementToArray<T>(
  setStateCallback: Dispatch<SetStateAction<any[]>>,
  path: PropertyName | PropertyName[],
  newValue: T | (() => T)
) {
  const resolvedNewValue = resolveValue(newValue);
  setStateCallback((prevState) => {
    if ((path as PropertyName[]).length === 0) {
      return [...prevState, resolvedNewValue];
    } else {
      const newArray = [...(get(prevState, path) as T[]), resolvedNewValue];
      const newState = [...prevState];
      set(newState, path, newArray);
      return newState;
    }
  });
}

/**
 * Remove an element from an array (or sub array indicating by path)
 * @param setStateCallback setState function
 * @param path lodash path, e.g. [0, indexPattern] or "[0].indexPattern", use [] to indicate root level
 * @param index index of element to be removed
 *
 * e.g.
 * Scenario 1, path = [] to append to root level array
 *  currentState = [1, 2]
 *  path = []
 *  index = 0
 * The newState will be [2]
 *
 * Scenario 2, path != [] to append to sub array
 *  currentState = [{a: [1, 2]}, {a: [3, 4]}]
 *  path = [0, 'a']
 *  index = 1
 * The newState will be [{a: [1]}, {a: [3, 4]}]
 */
export function removeElementFromArray<T>(
  setStateCallback: Dispatch<SetStateAction<any[]>>,
  path: PropertyName | PropertyName[],
  index: number
) {
  setStateCallback((prevState) => {
    if ((path as PropertyName[]).length === 0) {
      const newState = [...prevState];
      newState.splice(index, 1);
      return newState;
    } else {
      const newArray = [...(get(prevState, path) as T[])];
      newArray.splice(index, 1);
      const newState = [...prevState];
      set(newState, path, newArray);
      return newState;
    }
  });
}
