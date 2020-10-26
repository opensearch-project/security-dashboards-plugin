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

import { EuiFieldText, EuiFlexGroup } from '@elastic/eui';
import { shallow } from 'enzyme';
import React from 'react';
import {
  appendElementToArray,
  removeElementFromArray,
  updateElementInArrayHandler,
} from '../../../utils/array-state-utils';
import { AttributePanel, buildAttributeState, unbuildAttributeState } from '../attribute-panel';

jest.mock('../../../utils/array-state-utils', () => ({
  appendElementToArray: jest.fn(),
  removeElementFromArray: jest.fn(),
  updateElementInArrayHandler: jest.fn().mockReturnValue(jest.fn()),
}));

describe('User editing - attribute panel', () => {
  const attr1 = 'attr1';
  const value1 = 'value1';
  const attr2 = 'attr2';
  const value2 = 'value2';

  const setState = jest.fn();

  const sampleRawData = { [attr1]: value1, [attr2]: value2 };
  const sampleState = [
    { key: attr1, value: value1 },
    { key: attr2, value: value2 },
  ];

  it('buildAttributeState', () => {
    const result = buildAttributeState(sampleRawData);

    expect(result).toEqual(sampleState);
  });

  it('unbuildAttributeState', () => {
    const result = unbuildAttributeState(sampleState);

    expect(result).toEqual(sampleRawData);
  });

  describe('AttributePanel', () => {
    it('render an empty row when no data', () => {
      shallow(<AttributePanel state={[]} setState={setState} />);

      expect(setState).toBeCalledWith([{ key: '', value: '' }]);
    });

    it('render data', () => {
      const component = shallow(<AttributePanel state={sampleState} setState={setState} />);

      expect(component.find(EuiFlexGroup).length).toBe(2);
      expect(component.find(EuiFieldText).at(0).prop('value')).toBe(attr1);
      expect(component.find(EuiFieldText).at(1).prop('value')).toBe(value1);
      expect(component.find(EuiFieldText).at(2).prop('value')).toBe(attr2);
      expect(component.find(EuiFieldText).at(3).prop('value')).toBe(value2);
    });

    it('add row', () => {
      const component = shallow(<AttributePanel state={sampleState} setState={setState} />);
      component.find('#add-row').simulate('click');

      expect(appendElementToArray).toBeCalledWith(setState, [], { key: '', value: '' });
    });

    it('change attribute name', () => {
      const component = shallow(<AttributePanel state={sampleState} setState={setState} />);
      component.find('#attribute-0').simulate('change', { target: { value: '' } });

      expect(updateElementInArrayHandler).toBeCalledWith(setState, [0, 'key']);
    });

    it('change attribute value', () => {
      const component = shallow(<AttributePanel state={sampleState} setState={setState} />);
      component.find('#value-0').simulate('change', { target: { value: '' } });

      expect(updateElementInArrayHandler).toBeCalledWith(setState, [0, 'value']);
    });

    it('delete row', () => {
      const component = shallow(<AttributePanel state={sampleState} setState={setState} />);
      component.find('#delete-0').simulate('click');

      expect(removeElementFromArray).toBeCalledWith(setState, [], 0);
    });
  });
});
