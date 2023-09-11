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

import React from 'react';
import { CoreStart } from 'opensearch-dashboards/public';
import { EuiFieldText, EuiIcon } from '@elastic/eui';
import { FormRow } from './form-row';
import { PASSWORD_INSTRUCTION, PASSWORD_VALIDATION_REGEX } from '../../apps-constants';
import { getDashboardsInfo } from '../../../utils/dashboards-info-utils';

export function PasswordEditPanel(props: {
  coreStart: CoreStart;
  updatePassword: (p: string) => void;
  updateIsInvalid: (v: boolean) => void;
}) {
  const [password, setPassword] = React.useState<string>('');
  const [repeatPassword, setRepeatPassword] = React.useState<string>('');
  const [isRepeatPasswordInvalid, setIsRepeatPasswordInvalid] = React.useState<boolean>(false);
  const [passwordHelpText, setPasswordHelpText] = React.useState<string>(PASSWORD_INSTRUCTION);
  const [passwordValidationRegex, setPasswordValidationRegex] = React.useState<string>(
    PASSWORD_VALIDATION_REGEX
  );
  const [passwordErrors, setPasswordErrors] = React.useState<string[]>([]);

  const validatePassword = () => {
    if (!password.match(passwordValidationRegex)) {
      const errorMessages = ['Password does not match minimum criteria'];
      setPasswordErrors(errorMessages);
    } else {
      setPasswordErrors([]);
    }
  };

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const dashboardsInfo = await getDashboardsInfo(props.coreStart.http);
        setPasswordHelpText(dashboardsInfo.password_validation_error_message);
        setPasswordValidationRegex(dashboardsInfo.password_validation_regex);
      } catch (e) {
        console.error(e);
      }
    };

    fetchData();
  }, [props.coreStart.http]);

  React.useEffect(() => {
    props.updatePassword(password);
    const isInvalid = repeatPassword !== password || !password.match(passwordValidationRegex);
    setIsRepeatPasswordInvalid(repeatPassword !== password);
    props.updateIsInvalid(isInvalid);
  }, [password, props, repeatPassword, passwordValidationRegex]);

  const passwordChangeHandler = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
  };

  const repeatPasswordChangeHandler = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRepeatPassword(e.target.value);
  };

  return (
    <>
      <FormRow
        headerText="Password"
        helpText={passwordHelpText}
        isInvalid={passwordErrors.length > 0}
        error={passwordErrors}
      >
        <EuiFieldText
          data-test-subj="password"
          prepend={<EuiIcon type="lock" />}
          type="password"
          onChange={passwordChangeHandler}
          isInvalid={passwordErrors.length > 0}
          onBlur={() => validatePassword()}
          aria-label="password"
        />
      </FormRow>

      <FormRow
        headerText="Re-enter password"
        helpText="The password must be identical to what you entered above."
        isInvalid={isRepeatPasswordInvalid}
        error={
          isRepeatPasswordInvalid ? ['The password is not identical to the one entered above.'] : []
        }
      >
        <EuiFieldText
          data-test-subj="re-enter-password"
          prepend={<EuiIcon type="lock" />}
          type="password"
          isInvalid={isRepeatPasswordInvalid}
          onChange={repeatPasswordChangeHandler}
          aria-label="re-enter-password"
        />
      </FormRow>
    </>
  );
}
