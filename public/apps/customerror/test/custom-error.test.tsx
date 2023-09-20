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
import { logout } from '../utils';

jest.mock('../utils', () => ({
  logout: jest.fn(),
}));

describe('Custom error test', () => {
    it('renders', () => {
        const component = shallow(
            <CustomErrorPage
            title="Title"
            subtitle="Sub Title" http={undefined} chrome={undefined} config={{
              title: '',
              subtitle: '',
              showbrandimage: false,
              brandimage: '',
              buttonstyle: ''
            }}/>
          );
        expect(component).toMatchSnapshot();

        // component.find('[data-test-subj="log-out-3"]').simulate('click');

        // expect(logout).toBeCalled();
    });
})