/*
 *   Copyright OpenSearch Contributors
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

import { EuiFieldText, EuiFlexGroup, EuiFormRow } from '@elastic/eui';
import { mount, shallow } from 'enzyme';
import React from 'react';
import {
  appendElementToArray,
  removeElementFromArray,
  updateElementInArrayHandler,
} from '../../../utils/array-state-utils';
import { BackendRolePanel } from '../backend-role-panel';

jest.mock('../../../utils/array-state-utils', () => ({
  appendElementToArray: jest.fn(),
  removeElementFromArray: jest.fn(),
  updateElementInArrayHandler: jest.fn().mockReturnValue(jest.fn()),
  setRoleEmptyErrorMessage: jest.fn(),
}));

describe('User editing - backend role panel', () => {
  const setState = jest.fn();

  const backendRole1 = 'admin';
  const backendRole2 = 'HR';
  const sampleState = [backendRole1, backendRole2];

  describe('BackendRolePanel', () => {
    it('render an empty row when no data', () => {
      shallow(<BackendRolePanel state={[]} setState={setState} />);

      expect(setState).toBeCalledWith(['']);
    });

    it('render data', () => {
      const component = shallow(<BackendRolePanel state={sampleState} setState={setState} />);

      expect(component.find(EuiFlexGroup).length).toBe(2);
      expect(component.find(EuiFieldText).at(0).prop('value')).toBe(backendRole1);
      expect(component.find(EuiFieldText).at(1).prop('value')).toBe(backendRole2);
    });

    it('add row', () => {
      const component = shallow(<BackendRolePanel state={sampleState} setState={setState} />);
      component.find('#backend-role-add-row').simulate('click');

      expect(appendElementToArray).toBeCalledWith(setState, [], '');
    });

    it('change backend role value', () => {
      const component = shallow(<BackendRolePanel state={sampleState} setState={setState} />);
      component.find('#backend-role-0').simulate('change', { target: { value: '' } });

      expect(updateElementInArrayHandler).toBeCalledWith(setState, [0]);
    });

    it('delete row', () => {
      const component = shallow(<BackendRolePanel state={sampleState} setState={setState} />);
      component.find('#backend-role-delete-0').simulate('click');

      expect(removeElementFromArray).toBeCalledWith(setState, [], 0);
    });

    // TODO: Fix the tests for backend role error message
    it('add backend role when the previous role is blank', () => {
      const component = shallow(<BackendRolePanel state={[]} setState={setState} />);
      component.find('#backend-role-add-row').simulate('click');
      component.find('#backend-role-add-row').simulate('click');
      expect(component).toMatchSnapshot();
    });

    it('add backend role when one of the previous roles is blank', () => {
      const component = shallow(<BackendRolePanel state={sampleState} setState={setState} />);
      component.find('#backend-role-0').simulate('change', { target: { value: '' } });
      component.find('#backend-role-add-row').simulate('click');
      expect(component).toMatchSnapshot();
    });
  });
});
