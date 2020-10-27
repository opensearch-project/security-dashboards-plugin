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

import { EuiComboBox } from '@elastic/eui';
import { shallow } from 'enzyme';
import React from 'react';
import { ComboBoxOptions } from '../../../types';
import { InternalUsersPanel } from '../users-panel';

describe('Role mapping - Internal users panel', () => {
  it('render data', () => {
    const sampleUser1 = 'user1';
    const sampleUser2 = 'user2';
    const state: ComboBoxOptions = [{ label: sampleUser1 }];
    const optionUniverse: ComboBoxOptions = [{ label: sampleUser1 }, { label: sampleUser2 }];
    const setState = jest.fn();

    const component = shallow(
      <InternalUsersPanel state={state} optionUniverse={optionUniverse} setState={setState} />
    );

    const comboBox = component.find(EuiComboBox).first();
    expect(comboBox.prop('selectedOptions')).toBe(state);
    expect(comboBox.prop('options')).toBe(optionUniverse);
    expect(comboBox.prop('onChange')).toBe(setState);
  });
});
