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

import { shallow } from 'enzyme';
import React from 'react';
import { LogoutButton } from '../log-out-button';
import { logout } from '../utils';
import { AuthType } from '../../../../common';

jest.mock('../utils', () => ({
  logout: jest.fn(),
}));

describe('Account menu - Log out button', () => {
  const mockHttpStart = {
    basePath: {
      serverBasePath: '',
    },
  };
  const mockDivider = <></>;
  describe('renders', () => {
    it('renders when auth type is MultiAuth: openid', () => {
      const component = shallow(
        <LogoutButton authType={AuthType.OPEN_ID} http={mockHttpStart} divider={mockDivider} />
      );
      expect(component).toMatchSnapshot();
    });

    it('renders when auth type is MultiAuth: saml', () => {
      const component = shallow(
        <LogoutButton authType={AuthType.SAML} http={mockHttpStart} divider={mockDivider} />
      );
      expect(component).toMatchSnapshot();
    });

    it('renders when auth type is MultiAuth: basicauth', () => {
      const component = shallow(
        <LogoutButton authType={AuthType.BASIC} http={mockHttpStart} divider={mockDivider} />
      );
      expect(component).toMatchSnapshot();
    });

    it('renders when auth type is OpenId', () => {
      const component = shallow(
        <LogoutButton authType={AuthType.OPEN_ID} http={mockHttpStart} divider={mockDivider} />
      );
      expect(component).toMatchSnapshot();
    });

    it('renders when auth type is SAML', () => {
      const component = shallow(
        <LogoutButton authType={AuthType.SAML} http={mockHttpStart} divider={mockDivider} />
      );
      expect(component).toMatchSnapshot();
    });

    it('renders when auth type is Proxy', () => {
      const component = shallow(
        <LogoutButton authType={AuthType.PROXY} http={mockHttpStart} divider={mockDivider} />
      );
      expect(component).toMatchSnapshot();
    });

    it('renders when auth type is not OpenId, SAML, or Proxy', () => {
      const component = shallow(
        <LogoutButton authType="dummy" http={mockHttpStart} divider={mockDivider} />
      );
      expect(component).toMatchSnapshot();
    });
  });

  it('should call logout function on click when auth type is not OpenId, SAML, or Proxy', () => {
    const component = shallow(
      <LogoutButton authType="dummy" http={mockHttpStart} divider={mockDivider} />
    );
    component.find('[data-test-subj="log-out-3"]').simulate('click');

    expect(logout).toBeCalled();
  });
});
