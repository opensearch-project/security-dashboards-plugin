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
import { ClientConfigType } from '../../../types';

// afterEach function runs after each test suite is executed
afterEach(() => {
  cleanup();
});

// describe("Error page ", () => {
//   it('renders', () => {
//     const logout = shallow(
//         <button>
//           Logout
//         </button>
//           );
//   const button = screen.getByTestId("button");

//   // Test 1
//   test("Button Rendering", () => {
//       expect(button).toBeInTheDocument();
//   })

//   // Test 2
//   test("Button Text", () => {
//       expect(button).toHaveTextContent("Logout");
//   })
// })
// });

const configUiDefault = {
  basicauth: {
    login: {
      showbrandimage: true,
    },
  },
};

describe('Custom error test', () => {
  it('renders the button on the error page', () => {
    const component = shallow(
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

    expect(component).toMatchSnapshot();

    describe('event trigger testing', () => {
      const setState = jest.fn();
      const useState = jest.spyOn(React, 'useState');
      const config: ClientConfigType = {
        ui: configUiDefault,
        auth: {
          type: 'basicauth',
        },
      };
      beforeEach(() => {
        useState.mockImplementation((initialValue) => [initialValue, setState]);
        // add addtional funtionality to test the logout button click and its reroute
      });
    });
  });
});
