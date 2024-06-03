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

import { EuiBadge, EuiText, EuiInMemoryTable } from '@elastic/eui';
import { shallow } from 'enzyme';
import React from 'react';
import { EMPTY_FIELD_VALUE } from '../../ui-constants';
import { getUserList, InternalUsersListing } from '../../utils/internal-user-list-utils';
import { dictView, getColumns, ServiceAccountList } from '../service-account-list';

jest.mock('../../utils/internal-user-list-utils', () => ({
  getUserList: jest.fn(),
}));
jest.mock('../../../../utils/auth-info-utils', () => ({
  getAuthInfo: jest.fn().mockReturnValue({ user_name: 'user' }),
}));
jest.mock('../../utils/context-menu', () => ({
  useContextMenuState: jest
    .fn()
    .mockImplementation((buttonText, buttonProps, children) => [children, jest.fn()]),
}));

import { getAuthInfo } from '../../../../utils/auth-info-utils';
import { buildHashUrl } from '../../utils/url-builder';
import { Action } from '../../types';
import { ResourceType } from '../../../../../common';

describe('Service Account list', () => {
  describe('dictView', () => {
    it('- empty', () => {
      const result = dictView({});

      expect(result).toEqual(EMPTY_FIELD_VALUE);
    });

    it('dictView - non-empty', () => {
      const attr1 = 'attr1';
      const attr2 = 'attr2';
      const value1 = 'value1';
      const value2 = 'value2';
      const result = shallow(dictView({ [attr1]: value1, [attr2]: value2 }));

      expect(result.find(EuiText).at(0).prop('children')).toEqual([attr1, ': ', `"${value1}"`]);
      expect(result.find(EuiText).at(1).prop('children')).toEqual([attr2, ': ', `"${value2}"`]);
    });
  });

  describe('getColumns', () => {
    it('current user', () => {
      const columns = getColumns('user1');
      const usernameRenderer = columns[0].render as (usename: string) => JSX.Element;
      const Container = (props: { username: string }) => usernameRenderer(props.username);
      const result = shallow(<Container username={'user1'} />);

      expect(result.find(EuiBadge).length).toBe(1);
    });

    it('not current user', () => {
      const columns = getColumns('user1');
      const usernameRenderer = columns[0].render as (usename: string) => JSX.Element;
      const Container = (props: { username: string }) => usernameRenderer(props.username);
      const result = shallow(<Container username={'user2'} />);

      expect(result.find(EuiBadge).length).toBe(0);
    });
  });

  describe('ServiceAccountList', () => {
    const mockCoreStart = {
      http: 1,
    };
    const setState = jest.fn();
    jest.spyOn(React, 'useState').mockImplementation((initValue) => [initValue, setState]);

    it('render empty', () => {
      const component = shallow(
        <ServiceAccountList
          coreStart={mockCoreStart as any}
          navigation={{} as any}
          params={{} as any}
          config={{} as any}
        />
      );

      expect(component.find(EuiInMemoryTable).prop('items')).toEqual([]);
    });

    it('fetch data', () => {
      jest.spyOn(React, 'useEffect').mockImplementationOnce((f) => f());
      shallow(
        <ServiceAccountList
          coreStart={mockCoreStart as any}
          navigation={{} as any}
          params={{} as any}
          config={{} as any}
        />
      );

      expect(getUserList).toBeCalled();
      expect(getAuthInfo).toBeCalled();
    });

    it('fetch data error', () => {
      jest.spyOn(React, 'useEffect').mockImplementationOnce((f) => f());
      getUserList.mockImplementationOnce(() => {
        throw new Error();
      });
      // Hide the error message
      jest.spyOn(console, 'log').mockImplementationOnce(() => {});
      shallow(
        <ServiceAccountList
          coreStart={mockCoreStart as any}
          navigation={{} as any}
          params={{} as any}
          config={{} as any}
        />
      );

      // Expect error flag set to true
      expect(setState).toBeCalledWith(true);
    });
  });

  describe('Action menu Component', () => {
    const mockCoreStart = {
      http: {
        basePath: {
          serverBasePath: '',
        },
      },
    };
    let component;
    const mockSAListData: InternalUsersListing = {
      username: 'user_1',
      attributes: { service: 'true' },
      backend_roles: ['backend_role1'],
    };
    beforeEach(() => {
      jest.spyOn(React, 'useState').mockRestore();
      jest
        .spyOn(React, 'useState')
        .mockImplementationOnce(() => [[mockSAListData], jest.fn()])
        .mockImplementationOnce(() => [[mockSAListData], jest.fn()])
        .mockImplementationOnce(() => [false, jest.fn()])
        .mockImplementationOnce(() => ['', jest.fn()])
        .mockImplementationOnce(() => [false, jest.fn()])
        .mockImplementationOnce(() => [null, jest.fn()]);
      component = shallow(
        <ServiceAccountList
          coreStart={mockCoreStart as any}
          navigation={{} as any}
          params={{} as any}
          config={{} as any}
        />
      );
    });

    it('Edit click', () => {
      component.find('[data-test-subj="edit"]').simulate('click');
      expect(window.location.hash).toBe(
        buildHashUrl(ResourceType.users, Action.edit, mockSAListData.username)
      );
    });

    it('Duplicate click', () => {
      component.find('[data-test-subj="duplicate"]').simulate('click');
      expect(window.location.hash).toBe(
        buildHashUrl(ResourceType.users, Action.duplicate, mockSAListData.username)
      );
    });
  });

  describe('AccessError component', () => {
    let component;
    const mockCoreStart = {
      http: 1,
    };
    beforeEach(() => {
      getUserList.mockRejectedValue({ response: { status: 403 } });
      jest.spyOn(React, 'useState').mockRestore();
      jest
        .spyOn(React, 'useState')
        .mockImplementationOnce(() => [[], jest.fn()])
        .mockImplementationOnce(() => [[], jest.fn()])
        .mockImplementationOnce(() => [false, jest.fn()])
        .mockImplementationOnce(() => [true, jest.fn()])
        .mockImplementationOnce(() => ['', jest.fn()])
        .mockImplementationOnce(() => [false, jest.fn()])
        .mockImplementationOnce(() => [null, jest.fn()]);
    });

    it('should load access error component', () => {
      component = shallow(
        <ServiceAccountList
          coreStart={mockCoreStart as any}
          navigation={{} as any}
          params={{} as any}
          config={{} as any}
        />
      );
      expect(component).toMatchSnapshot();
    });
  });
});
