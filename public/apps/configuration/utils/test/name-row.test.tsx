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
import { NameRow } from '../name-row';
import { validateResourceName } from '../resource-validation-util';

jest.mock('../resource-validation-util', () => ({
  validateResourceName: jest.fn(),
  resourceNameHelpText: jest.fn().mockReturnValue('Help!!!'),
}));

describe('Name row', () => {
  let component;
  const mockSetNameState = jest.fn();
  const mockSetIsFormValid = jest.fn();
  const resourceName = 'dummy-resource-name';
  const resourceType = 'dummy-resource-type';
  const setState = jest.fn();
  const useState = jest.spyOn(React, 'useState');

  beforeEach(() => {
    useState.mockImplementation((initialValue) => [initialValue, setState]);

    component = shallow(
      <NameRow
        headerText="Header"
        resourceName={resourceName}
        resourceType={resourceType}
        action="create"
        fullWidth={true}
        setNameState={mockSetNameState}
        setIsFormValid={mockSetIsFormValid}
      />
    );
  });

  it('name field update', () => {
    const event = {
      target: { value: 'dummy' },
    } as React.ChangeEvent<HTMLInputElement>;
    component.find('[data-test-subj="name-text"]').simulate('change', event);
    expect(mockSetNameState).toHaveBeenCalledTimes(1);
  });

  it('should validate name on blur', (done) => {
    const errors = ['error1', 'error2'];
    (validateResourceName as jest.Mock).mockReturnValueOnce(errors);
    component.find('[data-test-subj="name-text"]').simulate('blur');
    process.nextTick(() => {
      expect(validateResourceName).toHaveBeenCalledTimes(1);
      expect(mockSetIsFormValid).toHaveBeenCalledTimes(1);
      expect(setState).toHaveBeenCalledWith(errors);
      done();
    });
  });
});
