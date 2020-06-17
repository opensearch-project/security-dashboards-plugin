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

import React, { useState, useEffect } from 'react';
import { EuiFieldText, EuiIcon } from '@elastic/eui';
import { FormRow } from './form-row';

export function PasswordEditPanel(props: {
  updatePassword: (p: string) => void;
  updateIsInvalid: (v: boolean) => void;
}) {
  const [password, setPassword] = useState<string>('');
  const [repeatPassword, setRepeatPassword] = useState<string>('');
  const [isRepeatPasswordInvalid, setIsRepeatPasswordInvalid] = useState<boolean>(false);

  useEffect(() => {
    props.updatePassword(password);
    const isValid = repeatPassword !== password;
    setIsRepeatPasswordInvalid(isValid);
    props.updateIsInvalid(isValid);
  }, [password, props, repeatPassword]);

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
        helpText="A good password will be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one digit, and one special character."
      >
        <EuiFieldText
          prepend={<EuiIcon type="lock" />}
          type="password"
          onChange={passwordChangeHandler}
        />
      </FormRow>

      <FormRow
        headerText="Re-enter password"
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
