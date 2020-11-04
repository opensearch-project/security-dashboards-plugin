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
import { ExpressionModal } from '../expression-modal';

describe('Expression modal', () => {
  const setState = jest.fn();
  const useState = jest.spyOn(React, 'useState');
  const title = 'Title';
  const expression = { key: 'value1' };

  it('renders when isModalVisible = True', () => {
    useState.mockImplementationOnce(() => [true, setState]);
    const component = shallow(<ExpressionModal title={title} expression={expression} />);
    expect(component).toMatchSnapshot();
  });

  it('should set isModalVisible to True when click on View expression', () => {
    useState.mockImplementationOnce(() => [false, setState]);
    const component = shallow(<ExpressionModal title={title} expression={expression} />);
    component.find('[data-test-subj="view-expression"]').simulate('click');
    expect(setState).toHaveBeenCalledWith(true);
  });

  it('should set isModalVisible to false when close Expression modal', () => {
    useState.mockImplementationOnce(() => [true, setState]);
    const component = shallow(<ExpressionModal title={title} expression={expression} />);
    component.find('[data-test-subj="expression-modal"]').simulate('close');
    expect(setState).toHaveBeenCalledWith(false);
  });
});
