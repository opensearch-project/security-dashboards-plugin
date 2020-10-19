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
import { fetchAccountInfo } from './utils';
import { GLOBAL_TENANT_RADIO_ID, TenantSwitchPanel } from './tenant-switch-panel';
import { keys } from 'lodash';

const mockAccountInfo = {
  data: {
    tenants: {
      ['tenant1']: true,
      ['tenant2']: true,
      ['tenant3']: true,
    },
    user_name: 'user1',
    user_requested_tenant: '',
  },
};

jest.mock('./utils', () => ({
  fetchAccountInfo: jest.fn().mockImplementation(() => {
    return mockAccountInfo;
  }),
}));

describe('Account menu -tenant switch panel', () => {
  const setState = jest.fn();
  const mockCoreStart = {
    http: 1,
  };
  const handleClose = jest.fn();
  const defaultConfig = {
    multitenancy: {
      enabled: true,
      tenants: {
        enable_private: true,
        enable_global: true,
      },
    },
  };
  const useEffect = jest.spyOn(React, 'useEffect');
  const useState = jest.spyOn(React, 'useState');

  beforeEach(() => {
    useEffect.mockImplementationOnce((f) => f());
    useState.mockImplementation((initialValue) => [initialValue, setState]);
  });

  it('fetch data', (done) => {
    shallow(
      <TenantSwitchPanel
        coreStart={mockCoreStart as any}
        handleClose={handleClose}
        config={defaultConfig as any}
      />
    );

    process.nextTick(() => {
      expect(fetchAccountInfo).toHaveBeenCalledTimes(1);
      expect(setState).toHaveBeenCalledWith(keys(mockAccountInfo.data.tenants));
      expect(setState).toHaveBeenCalledWith(mockAccountInfo.data.user_name);
      expect(setState).toHaveBeenCalledWith(GLOBAL_TENANT_RADIO_ID);
      done();
    });
  });

  it('error occurred while fetching data', (done) => {
    (fetchAccountInfo as jest.Mock).mockReturnValueOnce(() => {
      throw new Error();
    });
    const spy = jest.spyOn(console, 'error').mockImplementationOnce(() => {});
    shallow(
      <TenantSwitchPanel
        coreStart={mockCoreStart as any}
        handleClose={handleClose}
        config={defaultConfig as any}
      />
    );
    process.nextTick(() => {
      expect(spy).toHaveBeenCalled();
      done();
    });
  });

  it('handle modal close', () => {
    const component = shallow(
      <TenantSwitchPanel
        coreStart={mockCoreStart as any}
        handleClose={handleClose}
        config={defaultConfig as any}
      />
    );
    component.find('[data-test-subj="tenant-switch-modal"]').simulate('close');
    expect(handleClose).toBeCalled();
  });

  it('Confirm button should be disabled when multitenancy is disabled in Config', () => {
    const config = {
      multitenancy: {
        enabled: false,
        tenants: {
          enable_private: true,
          enable_global: true,
        },
      },
    };
    const component = shallow(
      <TenantSwitchPanel
        coreStart={mockCoreStart as any}
        handleClose={handleClose}
        config={config as any}
      />
    );
    const confirmButton = component.find('[data-test-subj="confirm"]');
    expect(confirmButton.prop('disabled')).toBe(true);
  });

  it('selected radio id should be change on onChange event', () => {
    const component = shallow(
      <TenantSwitchPanel
        coreStart={mockCoreStart as any}
        handleClose={handleClose}
        config={defaultConfig as any}
      />
    );
    component
      .find('[data-test-subj="tenant-switch-radios"]')
      .simulate('change', GLOBAL_TENANT_RADIO_ID);

    expect(setState).toBeCalledWith(GLOBAL_TENANT_RADIO_ID);
    expect(setState).toBeCalledWith('');
  });
});
