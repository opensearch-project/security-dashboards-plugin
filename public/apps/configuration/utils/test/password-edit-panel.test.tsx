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

import { mount, shallow } from 'enzyme';
import React from 'react';
import { PasswordEditPanel } from '../password-edit-panel';
import { getDashboardsInfo } from '../../../../utils/dashboards-info-utils';

const mockDashboardsInfo = {
  multitenancy_enabled: true,
  private_tenant_enabled: true,
  default_tenant: '',
  password_validation_error_message:
    'Password must be minimum 5 characters long and must contain at least one uppercase letter, one lowercase letter, one digit, and one special character.',
};

jest.mock('../../../../utils/dashboards-info-utils', () => ({
  getDashboardsInfo: jest.fn().mockImplementation(() => {
    return mockDashboardsInfo;
  }),
}));

describe('Password edit panel', () => {
  let component;
  const setState = jest.fn();
  const updatePassword = jest.fn();
  const updateIsInvalid = jest.fn();
  const useState = jest.spyOn(React, 'useState');
  const useEffect = jest.spyOn(React, 'useEffect');
  const mockCoreStart = {
    http: 1,
  };

  beforeEach(() => {
    useEffect.mockImplementationOnce((f) => f());
    useState.mockImplementation((initialValue) => [initialValue, setState]);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders', (done) => {
    mount(
      <PasswordEditPanel
        coreStart={mockCoreStart as any}
        updatePassword={updatePassword}
        updateIsInvalid={updateIsInvalid}
      />
    );
    process.nextTick(() => {
      expect(updatePassword).toHaveBeenCalledTimes(1);
      expect(updateIsInvalid).toHaveBeenCalledTimes(1);
      expect(setState).toBeCalledWith(mockDashboardsInfo.password_validation_error_message);
      done();
    });
  });

  it('password field update', () => {
    component = shallow(
      <PasswordEditPanel
        coreStart={mockCoreStart as any}
        updatePassword={updatePassword}
        updateIsInvalid={updateIsInvalid}
      />
    );
    const event = {
      target: { value: 'dummy' },
    } as React.ChangeEvent<HTMLInputElement>;
    component.find('[data-test-subj="password"]').simulate('change', event);
    expect(setState).toBeCalledWith('dummy');
  });

  it('repeat password field update', () => {
    component = shallow(
      <PasswordEditPanel
        coreStart={mockCoreStart as any}
        updatePassword={updatePassword}
        updateIsInvalid={updateIsInvalid}
      />
    );
    const event = {
      target: { value: 'dummy' },
    } as React.ChangeEvent<HTMLInputElement>;
    component.find('[data-test-subj="re-enter-password"]').simulate('change', event);
    expect(setState).toBeCalledWith('dummy');
  });
});
