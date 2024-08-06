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
import { EuiSmallButton } from '../custom-error';
import { logout } from '../../account/utils';

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
});
