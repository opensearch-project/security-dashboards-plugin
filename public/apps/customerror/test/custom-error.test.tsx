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
import { createMemoryHistory } from 'history';
import { CustomErrorPage, renderPage } from '../custom-error';
import { act, cleanup, fireEvent, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { EuiSmallButton } from '../custom-error';
import { logout } from '../../account/utils';
import { API_AUTH_LOGOUT, ERROR_MISSING_ROLE_PATH, JWT_AUTH_LOGOUT } from '../../../../common';

jest.mock('../../account/utils', () => ({
  ...jest.requireActual('../../account/utils'),
  logout: jest.fn(),
}));

afterEach(() => {
  cleanup();
});

describe('Custom error page test', () => {
  let component;

  beforeEach(() => {
    component = shallow(
      <EuiSmallButton fill onClick={logout} data-test-subj="error-logout-button" fullWidth>
        Logout
      </EuiSmallButton>
    );
  });

  it('renders and clicks the button on the error page', () => {
    const wrapper = shallow(
      <CustomErrorPage
        title="Title"
        subtitle="Sub Title"
        http={undefined}
        chrome={undefined}
        config={{
          title: '',
          subtitle: '',
          showbrandimage: false,
          brandimage: '',
          buttonstyle: '',
        }}
      />
    );

    expect(wrapper).toMatchSnapshot();

    component.find('[data-test-subj="error-logout-button"]').simulate('onClick', {
      preventDefault: () => {},
    });
  });

  it.each([
    ['jwt', JWT_AUTH_LOGOUT],
    ['basicauth', API_AUTH_LOGOUT],
  ])('logs out a %s session on the matching route', async (authType, logoutEndpoint) => {
    const http = { basePath: { serverBasePath: '' } };
    const element = document.createElement('div');
    document.body.appendChild(element);
    let unmount: () => boolean = () => false;
    await act(async () => {
      unmount = await renderPage(
        { http, chrome: {} } as any,
        {
          element,
          history: createMemoryHistory({ initialEntries: [ERROR_MISSING_ROLE_PATH] }),
        } as any,
        { auth: { type: authType }, ui: { basicauth: { login: {} } } } as any
      );
    });

    fireEvent.click(screen.getByTestId('error-logout-button'));

    expect(logout).toHaveBeenLastCalledWith(http, '', logoutEndpoint);
    unmount();
    element.remove();
  });
});
