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

import { GENERIC_ERROR_INSTRUCTION } from './apps-constants';

// TODO: use this util function for error message construction.
export function constructErrorMessageAndLog(exception: object, messagePrefix: string) {
  console.error(JSON.stringify(exception));

  // @ts-ignore
  const message = exception?.body?.message || GENERIC_ERROR_INSTRUCTION;

  if (messagePrefix) {
    return messagePrefix + ' ' + message;
  }

  return message;
}
