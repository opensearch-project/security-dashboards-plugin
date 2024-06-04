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
import { AccessErrorComponent } from '../access-error-component';

describe('AccessErrorComponent', () => {
  it('should render loading when loading the content', () => {
    const props = {
      dataSourceLabel: 'Test-cluster',
      loading: true,
    };
    const component = shallow(<AccessErrorComponent {...props} />);
    expect(component).toMatchSnapshot();
  });

  it('should display default message prefix once loading is complete', () => {
    const props = {
      loading: false,
      dataSourceLabel: 'Test-cluster',
    };
    const component = shallow(<AccessErrorComponent {...props} />);
    expect(component).toMatchSnapshot();
  });

  it('should display custom message prefix once loading is complete', () => {
    const props = {
      loading: false,
      dataSourceLabel: 'Test-cluster',
      message: 'Custom message prefix',
    };
    const component = shallow(<AccessErrorComponent {...props} />);
    expect(component).toMatchSnapshot();
  });
});
