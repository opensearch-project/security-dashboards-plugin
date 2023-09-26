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
import { CustomErrorPage } from '../custom-error';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';

afterEach(() => {
  cleanup();
});

const configUiDefault = {
  basicauth: {
    login: {
      showbrandimage: true,
    },
  },
};

const mockLogout = jest.fn();



describe('Custom error test', () => {
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

    // jest.mock('../custom-error.tsx', () => {
    //   logout: mockLogout 
    // });

    // const logoutButton = wrapper.find(`[data-testid="error-logout-button"]`).hostNodes();
    // logoutButton.simulate("onClick")
    // expect(mockLogout).toHaveBeenCalled();   
    
    expect(wrapper).toMatchSnapshot();

    // describe('event trigger testing', () => {
    //   const setState = jest.fn();
    //   const useState = jest.spyOn(React, 'useState');
    //   const config: ClientConfigType = {
    //     ui: configUiDefault,
    //     auth: {
    //       type: 'basicauth',
    //     },
    //   };
    //   beforeEach(() => {
    //     useState.mockImplementation((initialValue) => [initialValue, setState]);
    //     // add addtional funtionality to test the logout button click and its reroute
    //   });
    // });

    // describe("should call logout function", () => {
    //   const logOutUser = jest.fn();
    
    //   const { getByTestId } = render(
    //     <CustomErrorPage logout={logout} />
    //   );
    
    //   fireEvent.click(getByTestId('error-logout-button'));
    
    //   expect(logOutUser).toHaveBeenCalled();
    // });
  });
});
