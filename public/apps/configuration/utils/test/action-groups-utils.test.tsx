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

import { transformActionGroupsToListingFormat } from '../action-groups-utils';
import { ActionGroupItem } from '../../types';

describe('Action group utils', () => {
  const actionGroupItem: ActionGroupItem = {
    allowed_actions: ['*'],
    reserved: true,
    type: 'all',
  };
  const expectedPermissionListingItem = {
    name: 'actionGroup1',
    type: 'Action group',
    reserved: true,
    allowedActions: ['*'],
    hasClusterPermission: true,
    hasIndexPermission: true,
  };

  it('Tranform action groups to listing format', () => {
    const result = transformActionGroupsToListingFormat({ actionGroup1: actionGroupItem });
    expect(result).toEqual([expectedPermissionListingItem]);
  });
});
