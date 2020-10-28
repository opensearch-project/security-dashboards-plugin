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
import { RoleInfoPanel } from '../role-info-panel';
import { fetchAccountInfo } from '../utils';

jest.mock('../utils', () => ({
  fetchAccountInfo: jest.fn(),
}));

describe('Account menu - Role info panel', () => {
  const setState = jest.fn();
  const mockCoreStart = {
    http: 1,
  };
  const handleClose = jest.fn();

  const useEffect = jest.spyOn(React, 'useEffect');
  const useState = jest.spyOn(React, 'useState');

  beforeEach(() => {
    useEffect.mockImplementationOnce((f) => f());
    useState.mockImplementation((initialValue) => [initialValue, setState]);
  });

  it('fetch data', (done) => {
    const accountInfo = {
      data: {
        backend_roles: ['backend_role1', 'backend_role2'],
        roles: ['role1', 'role2'],
      },
    };
    (fetchAccountInfo as jest.Mock).mockReturnValueOnce(accountInfo);
    shallow(<RoleInfoPanel coreStart={mockCoreStart as any} handleClose={handleClose} />);

    process.nextTick(() => {
      expect(fetchAccountInfo).toHaveBeenCalledTimes(1);
      expect(setState).toHaveBeenCalledWith(accountInfo.data.roles);
      expect(setState).toHaveBeenCalledWith(accountInfo.data.backend_roles);
      done();
    });
  });

  it('fetch data error', (done) => {
    (fetchAccountInfo as jest.Mock).mockImplementationOnce(() => {
      throw Error();
    });
    // Hide the error message
    jest.spyOn(console, 'log').mockImplementationOnce(() => {});
    shallow(<RoleInfoPanel coreStart={mockCoreStart as any} handleClose={handleClose} />);
    process.nextTick(() => {
      expect(setState).toBeCalledTimes(0);
      done();
    });
  });

  it('should call handleClose on close event', () => {
    const component = shallow(
      <RoleInfoPanel coreStart={mockCoreStart as any} handleClose={handleClose} />
    );
    component.find('[data-test-subj="role-info-modal"]').simulate('close');
    expect(handleClose).toBeCalled();
  });

  it('renders', () => {
    useState.mockImplementationOnce(() => [['role1', 'role2'], setState]);
    useState.mockImplementationOnce(() => [['backend_role1', 'backend_role2'], setState]);
    const component = shallow(
      <RoleInfoPanel coreStart={mockCoreStart as any} handleClose={handleClose} />
    );
    expect(component).toMatchSnapshot();
  });
});
