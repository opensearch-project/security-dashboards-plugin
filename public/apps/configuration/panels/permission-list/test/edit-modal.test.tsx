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
import { PermissionEditModal } from '../edit-modal';
import { Action } from '../../../types';

describe('Permission edit modal', () => {
  it('Submit change', () => {
    const handleSave = jest.fn();
    const component = shallow(
      <PermissionEditModal
        groupName={'group1'}
        action={Action.create}
        allowedActions={[]}
        optionUniverse={[]}
        handleClose={jest.fn()}
        handleSave={handleSave}
      />
    );
    component.find('#submit').simulate('click');

    expect(handleSave).toBeCalled();
  });
});
