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
import { ClientConfigType } from '../../../types';
import { LoginPage } from '../login-page';
import { validateCurrentPassword } from '../../../utils/login-utils';

jest.mock('../../../utils/login-utils', () => ({
  validateCurrentPassword: jest.fn(),
}));

describe('Login page', () => {
  const mockHttpStart = {
    basePath: {
      serverBasePath: '/app/kibana',
    },
  };

  describe('renders', () => {
    it('renders with config value', () => {
      const config: ClientConfigType['ui']['basicauth']['login'] = {
        title: 'Title1',
        subtitle: 'SubTitle1',
        showbrandimage: true,
        brandimage: 'http://localhost:5601/images/test.png',
        buttonstyle: 'test-btn-style',
      };
      const component = shallow(<LoginPage http={mockHttpStart as any} config={config as any} />);
      expect(component).toMatchSnapshot();
    });

    it('renders with default value', () => {
      const component = shallow(<LoginPage http={mockHttpStart as any} config={{} as any} />);
      expect(component).toMatchSnapshot();
    });
  });

  describe('event trigger testing', () => {
    let component;
    const setState = jest.fn();
    const useState = jest.spyOn(React, 'useState');

    beforeEach(() => {
      useState.mockImplementation((initialValue) => [initialValue, setState]);
      component = shallow(<LoginPage http={mockHttpStart as any} config={{} as any} />);
    });

    it('should update user name field on change event', () => {
      const event = {
        target: { value: 'dummy' },
      } as React.ChangeEvent<HTMLInputElement>;
      component.find('[data-test-subj="user-name"]').simulate('change', event);
      expect(setState).toBeCalledWith('dummy');
    });

    it('should update password field on change event', () => {
      const event = {
        target: { value: 'dummy' },
      } as React.ChangeEvent<HTMLInputElement>;
      component.find('[data-test-subj="password"]').simulate('change', event);
      expect(setState).toBeCalledWith('dummy');
    });
  });

  describe('handle submit event', () => {
    let component;
    const useState = jest.spyOn(React, 'useState');
    const setState = jest.fn();

    beforeEach(() => {
      useState.mockImplementation(() => ['user1', setState]);
      useState.mockImplementation(() => ['password1', setState]);
      component = shallow(<LoginPage http={mockHttpStart as any} config={{} as any} />);
    });

    it('submit click event', () => {
      window = Object.create(window);
      const url = 'http://dummy.com';
      Object.defineProperty(window, 'location', {
        value: {
          href: url,
        },
      });
      component.find('[data-test-subj="submit"]').simulate('click', {
        preventDefault: () => {},
      });
      expect(validateCurrentPassword).toHaveBeenCalledTimes(1);
    });
  });
});
