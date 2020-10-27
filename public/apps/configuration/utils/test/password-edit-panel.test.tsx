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
import { PasswordEditPanel } from '../password-edit-panel';

describe('Password edit panel', () => {
  let component;
  const setState = jest.fn();
  const updatePassword = jest.fn();
  const updateIsInvalid = jest.fn();
  const useState = jest.spyOn(React, 'useState');
  const useEffect = jest.spyOn(React, 'useEffect');

  beforeEach(() => {
    useEffect.mockImplementationOnce((f) => f());
    useState.mockImplementation((initialValue) => [initialValue, setState]);
    component = shallow(
      <PasswordEditPanel updatePassword={updatePassword} updateIsInvalid={updateIsInvalid} />
    );
  });

  it('renders', () => {
    expect(updatePassword).toHaveBeenCalledTimes(1);
    expect(updateIsInvalid).toHaveBeenCalledTimes(1);
  });

  it('password field update', () => {
    const event = {
      target: { value: 'dummy' },
    } as React.ChangeEvent<HTMLInputElement>;
    component.find('[data-test-subj="password"]').simulate('change', event);
    expect(setState).toBeCalledWith('dummy');
  });

  it('repeat password field update', () => {
    const event = {
      target: { value: 'dummy' },
    } as React.ChangeEvent<HTMLInputElement>;
    component.find('[data-test-subj="re-enter-password"]').simulate('change', event);
    expect(setState).toBeCalledWith('dummy');
  });
});
