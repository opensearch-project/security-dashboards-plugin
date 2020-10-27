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

import {
  getFieldLevelSecurityMethod,
  transformRoleIndexPermissions,
} from '../index-permission-utils';

describe('Index permission utils', () => {
  it('should retrun "exclude" field level security method if fields leading with ~', () => {
    const excludeFields = ['~field1', '~field2'];
    const result = getFieldLevelSecurityMethod(excludeFields);
    expect(result).toBe('exclude');
  });

  it('should return "include" field level security method if no field leads with ~', () => {
    const includeFields = ['field1', 'field2'];
    const result = getFieldLevelSecurityMethod(includeFields);
    expect(result).toBe('include');
  });

  it('transform role index permission', () => {
    const mockRoleIndexPermission = [
      {
        index_patterns: ['*'],
        dls: '',
        fls: [],
        masked_fields: [],
        allowed_actions: [],
      },
      {
        index_patterns: ['a*'],
        dls: '',
        fls: [],
        masked_fields: [],
        allowed_actions: [],
      },
    ];

    const expectedRoleIndexPermissionView = [
      {
        id: 0,
        index_patterns: ['*'],
        dls: '',
        fls: [],
        masked_fields: [],
        allowed_actions: [],
      },
      {
        id: 1,
        index_patterns: ['a*'],
        dls: '',
        fls: [],
        masked_fields: [],
        allowed_actions: [],
      },
    ];
    const result = transformRoleIndexPermissions(mockRoleIndexPermission);
    expect(result).toEqual(expectedRoleIndexPermissionView);
  });
});
