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

import { generateResourceName } from '../resource-utils';

describe('generateResourceName', () => {
  it('edit should return same name', () => {
    const result = generateResourceName('edit', 'user1');

    expect(result).toBe('user1');
  });

  it('duplicate should append _copy suffix', () => {
    const result = generateResourceName('duplicate', 'role1');

    expect(result).toBe('role1_copy');
  });

  it('other action should return empty string', () => {
    const result = generateResourceName('create', 'tenant1');

    expect(result).toBe('');
  });
});
