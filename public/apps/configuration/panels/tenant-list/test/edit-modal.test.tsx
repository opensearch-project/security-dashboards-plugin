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
import { TenantEditModal } from '../edit-modal';
import { Action } from '../../../types';

describe('Permission edit modal', () => {
  let component;
  const handleSave = jest.fn();
  const setState = jest.fn();
  const useState = jest.spyOn(React, 'useState');
  beforeEach(() => {
    useState.mockImplementation((initialValue) => [initialValue, setState]);
    component = shallow(
      <TenantEditModal
        tenantName={'tenant1'}
        tenantDescription={'description1'}
        action={Action.create}
        handleClose={jest.fn()}
        handleSave={handleSave}
      />
    );
  });
  it('Submit change', () => {
    component.find('#submit').simulate('click');

    expect(handleSave).toBeCalled();
  });

  it('handle tenant description change', () => {
    const event = {
      target: { value: 'dummy' },
    } as React.ChangeEvent<HTMLTextAreaElement>;
    component.find('[data-test-subj="tenant-description"]').simulate('change', event);
    expect(setState).toBeCalledWith('dummy');
  });

  it('Submit button text should be Create when user is creating tenant', () => {
    const submitButton = component.find('#submit').dive();
    expect(submitButton).toMatchSnapshot();
  });

  it('Submit button text should be Save when user is updating tenant', () => {
    const component1 = shallow(
      <TenantEditModal
        tenantName={'tenant1'}
        tenantDescription={'description1'}
        action={Action.edit}
        handleClose={jest.fn()}
        handleSave={handleSave}
      />
    );
    const submitButton = component1.find('#submit').dive();
    expect(submitButton).toMatchSnapshot();
  });
});
