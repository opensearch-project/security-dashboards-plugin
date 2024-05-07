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

import { render, shallow } from 'enzyme';
import React from 'react';
import { PasswordStrengthBar } from '../password-strength-bar';

describe('Password strength bar tests', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders', () => {
    const component = shallow(<PasswordStrengthBar password="test" />);
    expect(component).toMatchSnapshot();
  });

  it('verifies feedback, warning for very weak password', () => {
    const component = render(<PasswordStrengthBar password="test" />);

    const suggestions = component.find('[data-test-subj="password-strength-feedback-suggestions"]');
    expect(suggestions.text()).toBe('Add another word or two. Uncommon words are better.');

    const score = component.find('[data-test-subj="password-strength-progress"]');
    expect(score.prop('value')).toBe('0'); // test is considered very weak
  });

  it('verifies feedback, warning for weak password', () => {
    const component = render(<PasswordStrengthBar password="test12" />);

    const suggestions = component.find('[data-test-subj="password-strength-feedback-suggestions"]');
    expect(suggestions.text()).toBe('Add another word or two. Uncommon words are better.');

    const score = component.find('[data-test-subj="password-strength-progress"]');
    expect(score.prop('value')).toBe('1'); // test12 is considered weak
  });

  it('verifies feedback, warning for an ok password', () => {
    const component = render(<PasswordStrengthBar password="test124My" />);

    const suggestions = component.find('[data-test-subj="password-strength-feedback-suggestions"]');
    expect(suggestions.text()).toBe('Add another word or two. Uncommon words are better.');

    const score = component.find('[data-test-subj="password-strength-progress"]');
    expect(score.prop('value')).toBe('2'); // test124My is considered ok
  });

  it('verifies feedback, warning for a strong password', () => {
    const component = render(<PasswordStrengthBar password="test124MyTable" />);

    const suggestions = component.find('[data-test-subj="password-strength-feedback-suggestions"]');
    expect(suggestions.text()).toBe('');

    const score = component.find('[data-test-subj="password-strength-progress"]');
    expect(score.prop('value')).toBe('3'); // test124MyTable is considered strong
  });

  it('verifies feedback, warning for very strong password', () => {
    const component = render(<PasswordStrengthBar password="myStrongPassword123!" />);

    const suggestions = component.find('[data-test-subj="password-strength-feedback-suggestions"]');
    expect(suggestions.text()).toBe('');

    const score = component.find('[data-test-subj="password-strength-progress"]');
    expect(score.prop('value')).toBe('4'); // myStrongPassword123! is considered very strong
  });
});
