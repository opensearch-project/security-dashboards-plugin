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

import React, { useState } from 'react';
import { EuiFieldText, EuiIcon } from '@elastic/eui';
import { FormRow } from './form-row';

// At least one uppercase, one lowercase, one digit and one special character
// and at least 8 characters long
const PASSWORD_PATTERN = /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?([^\w\s]|[_])).{8,}$/;

export function PasswordEditPanel(props: {
  updatePassword: (p: string) => void;
  updateIsInvalid: (v: boolean) => void;
}) {
  const [password, setPassword] = useState('');
  const [isPasswordInvalid, setIsPasswordInvalid] = useState(false);
  const [isRepeatPasswordInvalid, setIsRepeatPasswordInvalid] = useState(false);

  const updateValidStatus = () => {
    props.updateIsInvalid(isPasswordInvalid || isRepeatPasswordInvalid);
  };

  const passwordChangeHandler = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setPassword(newValue);
    setIsPasswordInvalid(!PASSWORD_PATTERN.test(newValue) && newValue !== '');
    props.updatePassword(newValue);
    updateValidStatus();
  };

  const repeatPasswordChangeHandler = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setIsRepeatPasswordInvalid(newValue !== password);
    updateValidStatus();
  };

  return (
    <>
      <FormRow
        headerText="Password"
        helpText="Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one digit, and one special character."
      >
        <EuiFieldText
          prepend={<EuiIcon type="lock" />}
          type="password"
          isInvalid={isPasswordInvalid}
          onChange={passwordChangeHandler}
        />
      </FormRow>

      <FormRow
        headerText="Re-enter assword"
        helpText="The password must be identical to what you entered above"
      >
        <EuiFieldText
          prepend={<EuiIcon type="lock" />}
          type="password"
          isInvalid={isRepeatPasswordInvalid}
          onChange={repeatPasswordChangeHandler}
        />
      </FormRow>
    </>
  );
}
