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
import XRegExp from 'xregexp';
import { isEmpty } from 'lodash';
import {
  MIN_NUMBER_OF_CHARS_IN_RESOURCE_NAME,
  MAX_NUMBER_OF_CHARS_IN_RESOURCE_NAME,
} from '../constants';

const RESOURCE_ID_REGEX = XRegExp('^[\\p{L}\\p{N}\\p{P}-]+$', 'u');

const VALID_LENGTH_HELP_TEXT = (resourceType: string) => {
  return `The ${resourceType} name must contain from ${MIN_NUMBER_OF_CHARS_IN_RESOURCE_NAME} to ${MAX_NUMBER_OF_CHARS_IN_RESOURCE_NAME} characters.`;
};

const VALID_CHARACTERS_HELP_TEXT =
  'Valid characters are A-Z, a-z, 0-9, (_)underscore, (-) hyphen and unicode characters.';

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
  if (
    resourceName.length < MIN_NUMBER_OF_CHARS_IN_RESOURCE_NAME ||
    resourceName.length > MAX_NUMBER_OF_CHARS_IN_RESOURCE_NAME
  )
    return false;
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
