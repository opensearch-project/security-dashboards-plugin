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
import { validateCurrentPassword } from '../../../utils/login-utils';
import { PasswordResetPanel } from '../password-reset-panel';
import { logout, updateNewPassword } from '../utils';

jest.mock('../utils', () => ({
  logout: jest.fn(),
  updateNewPassword: jest.fn(),
}));

jest.mock('../../../utils/login-utils', () => ({
  validateCurrentPassword: jest.fn(),
}));

describe('Account menu - Password reset panel', () => {
  let component;
  const handleClose = jest.fn();
  const mockCoreStart = {
    http: 1,
  };
  const userName = 'dummy';
  const setState = jest.fn();
  const useState = jest.spyOn(React, 'useState');

  beforeEach(() => {
    component = shallow(
      <PasswordResetPanel
        coreStart={mockCoreStart as any}
        username={userName}
        handleClose={handleClose}
      />
    );
    useState.mockImplementation((initialValue) => [initialValue, setState]);
  });

  it('handle modal close', () => {
    component.find('[data-test-subj="reset-password-modal"]').simulate('close');
    expect(handleClose).toBeCalled();
  });

  it('click cancel button', () => {
    component.find('[data-test-subj="cancel"]').simulate('click');
    expect(handleClose).toBeCalled();
  });

  it('click reset button', (done) => {
    component.find('[data-test-subj="reset"]').simulate('click');
    process.nextTick(() => {
      expect(logout).toHaveBeenCalledTimes(1);
      expect(updateNewPassword).toHaveBeenCalledTimes(1);
      expect(validateCurrentPassword).toHaveBeenCalledTimes(1);
      done();
    });
  });

  it('invalid current password', (done) => {
    (validateCurrentPassword as jest.Mock).mockImplementationOnce(() => {
      throw new Error();
    });

    // Hide the error message
    jest.spyOn(console, 'error').mockImplementationOnce(() => {});

    component.find('[data-test-subj="reset"]').simulate('click');
    process.nextTick(() => {
      expect(setState).toHaveBeenCalledWith(true);
      expect(setState).toBeTruthy();
      done();
    });
  });

  it('failed to update new password', (done) => {
    (updateNewPassword as jest.Mock).mockImplementationOnce(() => {
      throw new Error();
    });
    // Hide the error message
    jest.spyOn(console, 'error').mockImplementationOnce(() => {});

    component.find('[data-test-subj="reset"]').simulate('click');

    process.nextTick(() => {
      expect(setState).toBeTruthy();
      done();
    });
  });

  it('Current password field update', () => {
    const event = {
      target: { value: 'dummy' },
    } as React.ChangeEvent<HTMLInputElement>;
    component.find('[data-test-subj="current-password"]').simulate('change', event);
    expect(setState).toBeCalledWith('dummy');
    expect(setState).toBeCalledWith(false);
  });

  it('New password field update', () => {
    const event = {
      target: { value: 'dummy' },
    } as React.ChangeEvent<HTMLInputElement>;
    component.find('[data-test-subj="new-password"]').simulate('change', event);
    expect(setState).toBeCalledWith('dummy');
    expect(setState).toBeCalledWith(false);
    expect(setState).toBeCalledWith(false);
  });

  it('Re-enter new password field update', () => {
    const event = {
      target: { value: 'dummy' },
    } as React.ChangeEvent<HTMLInputElement>;
    component.find('[data-test-subj="reenter-new-password"]').simulate('change', event);
    expect(setState).toBeCalledWith('dummy');
    expect(setState).toBeCalledWith(true);
  });
});
