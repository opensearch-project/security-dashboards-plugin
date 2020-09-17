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
import { useState } from 'react';
import XRegExp from 'xregexp';
import { isEmpty } from 'lodash';
import { m, n } from '../constants';

const RESOURCE_ID_REGEX = XRegExp('^[\\p{L}\\p{N}\\p{P}-]+$', 'u');

const VALID_LENGTH_HELP_TEXT = (resourceType: string) => {
  return `The ${resourceType} name must contain from ${m} to ${n} characters.`;
};

const VALID_CHARACTERS_HELP_TEXT =
  'Valid characters are A-Z, a-z, 0-9, (_)underscore, (-) hyphen and unicode characters.';

export interface UseErrorState {
  showErrors: boolean;
  errors: string[];
  checkForResourceNameErrors: (resourceType: string, resourceName: string) => void;
}

export function useErrorState(): UseErrorState {
  const [showErrors, setShowErrors] = useState<boolean>(false);
  const [errors, setErrors] = useState<string[]>([]);

  const checkForResourceNameErrors = (resourceType: string, resourceName: string) => {
    const errorMessages = validateResourceName(resourceType, resourceName);
    if (errorMessages.length > 0) {
      setShowErrors(true);
      setErrors(errorMessages);
    } else {
      setShowErrors(false);
      setErrors([]);
    }
  };

  return { showErrors, errors, checkForResourceNameErrors };
}
export function validateResourceName(resourceType: string, resourceName: string): string[] {
  const errors: string[] = [];
  if (!isResourceNameLengthValid(resourceName)) {
    errors.push(VALID_LENGTH_HELP_TEXT(resourceType));
  }

  if (!isResourceNameValid(resourceName)) {
    errors.push(`Invalid characters found in ${resourceType} name. ${VALID_CHARACTERS_HELP_TEXT}`);
  }
  return errors;
}

export function isResourceNameLengthValid(resourceName: string): boolean {
  if (resourceName.length < m || resourceName.length > n) return false;
  return true;
}

export function isResourceNameValid(resourceName: string): boolean {
  if (!isEmpty(resourceName) && !XRegExp.test(resourceName, RESOURCE_ID_REGEX)) {
    return false;
  }
  return true;
}

export function resourceNameHelpText(resourceType: string): string {
  return `${VALID_LENGTH_HELP_TEXT(resourceType)} ${VALID_CHARACTERS_HELP_TEXT}`;
}
