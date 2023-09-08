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

// TODO: use this constant for wherever the generic error instruction is used.
export const GENERIC_ERROR_INSTRUCTION =
  'You may refresh the page to retry or see browser console for more information.';

export const PASSWORD_INSTRUCTION =
  'Password should be at least 8 characters long and contain at least one uppercase ' +
  'letter, one lowercase letter, one digit, and one special character.';

export const PASSWORD_VALIDATION_REGEX = '(?=.*[A-Z])(?=.*[^a-zA-Z\\d])(?=.*[0-9])(?=.*[a-z]).{8,}';
