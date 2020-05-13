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

import { get, set, curry, StringRepresentable } from 'lodash';
import { Dispatch, SetStateAction } from 'react';

function resolveValue<T>(
  value: T | (() => T)
) {
  return (typeof value === 'function') ? (value as Function)() : value;
}

export function updateElementInArray<T>(
  setStateFunc: Dispatch<SetStateAction<any[]>>,
  path: StringRepresentable|StringRepresentable[],
  newValue: T | (() => T)
) {
  setStateFunc(prevState => {
    let newState = [...prevState];
    set(newState, path, resolveValue(newValue));
    return newState;
  });
}

export const updateElementInArrayHandler = curry(updateElementInArray);

export function appendElementToArray<T>(
  setStateFunc: Dispatch<SetStateAction<any[]>>,
  path: StringRepresentable|StringRepresentable[],
  newValue: T | (() => T)
) {
  const resolvedNewValue = resolveValue(newValue);
  setStateFunc(prevState => {
    if ((path as StringRepresentable[]).length == 0) {
      let newState = [...prevState, resolvedNewValue];
      return newState;
    }
    else {
      const newArray = [...(get(prevState, path) as T[]), resolvedNewValue];
      let newState = [...prevState];
      set(newState, path, newArray);
      return newState;
    }
  });
}

export function appendOptionToComboBox(
  setStateFunc: Dispatch<SetStateAction<any[]>>,
  path: StringRepresentable|StringRepresentable[],
  newValue: string
) {
  appendElementToArray(setStateFunc, path, { label: newValue });
}

export const appendOptionToComboBoxHandler = curry(appendOptionToComboBox);

export function removeElementFromArray<T>(
  setStateFunc: Dispatch<SetStateAction<any[]>>,
  path: StringRepresentable|StringRepresentable[],
  index: number
) {
  setStateFunc(prevState => {
    if ((path as StringRepresentable[]).length == 0) {
      let newState = [...prevState];
      newState.splice(index, 1);
      return newState;
    }
    else {
      let newArray = [...(get(prevState, path) as T[])];
      newArray.splice(index, 1);
      let newState = [...prevState];
      set(newState, path, newArray);
      return newState;
    }
  });
}

export const removeElementFromArrayHandler = curry(appendOptionToComboBox);