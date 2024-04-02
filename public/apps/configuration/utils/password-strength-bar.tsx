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

import { EuiFlexGroup, EuiFlexItem, EuiProgress, EuiText } from '@elastic/eui';
import React from 'react';
import zxcvbn from 'zxcvbn';

interface PasswordStrengthBarProps {
  password: string;
}

export const PasswordStrengthBar = (props: PasswordStrengthBarProps) => {
  const { password } = props;
  const passwordStrength = zxcvbn(password);
  const strength = passwordStrength.score;
  let message;
  switch (strength) {
    case 0:
      message = 'Very weak';
      break;
    case 1:
      message = 'Weak';
      break;
    case 2:
      message = 'Ok';
      break;
    case 3:
      message = 'Strong';
      break;
    case 4:
      message = 'Very strong';
      break;
  }

  return (
    password && (
      <EuiFlexGroup direction="column">
        <EuiFlexItem>
          <EuiProgress
            value={strength}
            max={4}
            size="m"
            valueText={message}
            label={'Password strength'}
            data-test-subj="password-strength-progress"
          />
        </EuiFlexItem>
        {passwordStrength.feedback.warning && (
          <EuiFlexItem>
            <EuiText size="xs" data-test-subj="password-strength-feedback-warning">
              {passwordStrength.feedback.warning}
            </EuiText>
          </EuiFlexItem>
        )}
        {passwordStrength.feedback.suggestions && (
          <EuiFlexItem>
            <EuiText size="xs" data-test-subj="password-strength-feedback-suggestions">
              {passwordStrength.feedback.suggestions}
            </EuiText>
          </EuiFlexItem>
        )}
      </EuiFlexGroup>
    )
  );
};
