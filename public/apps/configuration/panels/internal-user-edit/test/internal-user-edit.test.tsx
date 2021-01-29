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
import { InternalUserUpdate } from '../../../types';
import { getUserDetail, updateUser } from '../../../utils/internal-user-detail-utils';
import { createErrorToast } from '../../../utils/toast-utils';
import { AttributePanel } from '../attribute-panel';
import { InternalUserEdit } from '../internal-user-edit';

jest.mock('../../../utils/internal-user-detail-utils', () => ({
  getUserDetail: jest.fn().mockResolvedValue({ attributes: {}, backend_roles: [] }),
  updateUser: jest.fn(),
}));

jest.mock('../../../utils/toast-utils', () => ({
  createErrorToast: jest.fn(),
  createUnknownErrorToast: jest.fn(),
  useToastState: jest.fn().mockReturnValue([[], jest.fn(), jest.fn()]),
}));

describe('Internal user edit', () => {
  const sampleUsername = 'user1';
  const mockCoreStart = {
    http: 1,
  };
  const buildBreadcrumbs = jest.fn();

  const useEffect = jest.spyOn(React, 'useEffect');
  const useState = jest.spyOn(React, 'useState');
  const setState = jest.fn();

  it('basic rendering', () => {
    const action = 'create';

    const component = shallow(
      <InternalUserEdit
        action={action}
        sourceUserName={sampleUsername}
        buildBreadcrumbs={buildBreadcrumbs}
        coreStart={mockCoreStart as any}
        navigation={{} as any}
        params={{} as any}
        config={{} as any}
      />
    );

    expect(buildBreadcrumbs).toBeCalledTimes(1);
    expect(component.find(AttributePanel).length).toBe(1);
  });

  it('pull user data for editing', () => {
    useEffect.mockImplementationOnce((f) => f());
    useState.mockImplementation((initialValue) => [initialValue, setState]);
    const action = 'edit';

    const component = shallow(
      <InternalUserEdit
        action={action}
        sourceUserName={sampleUsername}
        buildBreadcrumbs={buildBreadcrumbs}
        coreStart={mockCoreStart as any}
        navigation={{} as any}
        params={{} as any}
        config={{} as any}
      />
    );

    expect(getUserDetail).toBeCalledWith(mockCoreStart.http, sampleUsername);
  });

  it('should not submit if password is empty on creation', () => {
    const action = 'create';
    useState.mockImplementation((initialValue) => [initialValue, setState]);

    const component = shallow(
      <InternalUserEdit
        action={action}
        sourceUserName={sampleUsername}
        buildBreadcrumbs={buildBreadcrumbs}
        coreStart={mockCoreStart as any}
        navigation={{} as any}
        params={{} as any}
        config={{} as any}
      />
    );
    component.find('#submit').simulate('click');

    expect(createErrorToast).toBeCalled();
    expect(updateUser).toBeCalledTimes(0);
  });

  it('submit change', () => {
    const action = 'edit';

    const component = shallow(
      <InternalUserEdit
        action={action}
        sourceUserName={sampleUsername}
        buildBreadcrumbs={buildBreadcrumbs}
        coreStart={mockCoreStart as any}
        navigation={{} as any}
        params={{} as any}
        config={{} as any}
      />
    );
    component.find('#submit').simulate('click');

    expect(updateUser).toBeCalled();
    const userUpdateObj: InternalUserUpdate = updateUser.mock.calls[0][0];
    expect(userUpdateObj.password).toEqual(undefined);
  });

  it('should create error toast when password is invalid', () => {
    const action = 'edit';
    useState.mockImplementation((initialValue) => [true, setState]);

    const component = shallow(
      <InternalUserEdit
        action={action}
        sourceUserName={sampleUsername}
        buildBreadcrumbs={buildBreadcrumbs}
        coreStart={mockCoreStart as any}
        navigation={{} as any}
        params={{} as any}
        config={{} as any}
      />
    );
    component.find('#submit').simulate('click');

    expect(createErrorToast).toBeCalled();
    expect(updateUser).toBeCalledTimes(0);
  });
});
