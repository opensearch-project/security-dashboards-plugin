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

import { shallow } from 'enzyme';
import React from 'react';
import { ActionGroupItem, DataObject } from '../../../types';
import { PermissionTree } from '../permission-tree';

describe('Permission tree', () => {
  const permissions = ['permission1'];
  const actionGroupItem: DataObject<ActionGroupItem> = {
    permission1: {
      allowed_actions: ['permission11'],
      reserved: true,
      type: 'index',
    },
    permission11: {
      allowed_actions: ['permission12'],
      reserved: true,
      type: 'index',
    },
    permission12: {
      allowed_actions: ['permission13'],
      reserved: true,
      type: 'index',
    },
    permission13: {
      allowed_actions: ['permission14'],
      reserved: true,
      type: 'index',
    },
    permission14: {
      allowed_actions: ['permission15'],
      reserved: true,
      type: 'index',
    },
    permission15: {
      allowed_actions: ['permission16'],
      reserved: true,
      type: 'index',
    },
  };

  it('renders', () => {
    const component = shallow(
      <PermissionTree permissions={permissions} actionGroups={actionGroupItem} />
    );
    expect(component).toMatchSnapshot();
  });
});
