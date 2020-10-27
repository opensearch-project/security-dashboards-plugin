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

import { transformUserData } from '../internal-user-list-utils';

describe('Internal user list utils', () => {
  const userList = {
    attributes: { attribute1: 'value1', attribute2: 'value2' },
    backend_roles: ['backendRole1', 'backendRole2'],
  };

  it('transform user list', () => {
    const result = transformUserData({ user1: userList });
    const expectedUserList = [
      {
        username: 'user1',
        attributes: userList.attributes,
        backend_roles: userList.backend_roles,
      },
    ];
    expect(result).toEqual(expectedUserList);
  });
});
