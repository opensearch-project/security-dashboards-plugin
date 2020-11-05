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

import { resourceNameHelpText, validateResourceName } from '../resource-validation-util';

describe('Resource validation util', () => {
  const resourceType = 'dummy';
  const validResourceName = 'resource1';
  const resourceNameWithInvalidChar = 'resource1%';
  const resourceNameWithInvalidLength1 = 'r';
  const resourceNameWithInvalidLength2 = 'rrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrr'; // 51 Characters

  it('should return no error when resource name is valid', () => {
    const errors = validateResourceName(resourceType, validResourceName);
    expect(errors).toHaveLength(0);
  });

  it('should return error when resource name length is less than min valid length', () => {
    const errors = validateResourceName(resourceType, resourceNameWithInvalidLength1);
    expect(errors).not.toHaveLength(0);
  });

  it('should return error when resource name length is greater than max valid length', () => {
    const errors = validateResourceName(resourceType, resourceNameWithInvalidLength2);
    expect(errors).not.toHaveLength(0);
  });

  it('should return error when resource name contains invalid character', () => {
    const errors = validateResourceName(resourceType, resourceNameWithInvalidChar);
    expect(errors).not.toHaveLength(0);
  });

  it('resource name help text should contain passed resource type', () => {
    const helpText = resourceNameHelpText(resourceType);
    expect(helpText).toContain(resourceType);
  });
});
