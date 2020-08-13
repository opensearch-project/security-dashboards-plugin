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
import {
  EuiButton,
  EuiButtonEmpty,
  EuiFieldPassword,
  EuiModal,
  EuiModalBody,
  EuiModalFooter,
  EuiOverlayMask,
  EuiSpacer,
  EuiTitle,
} from '@elastic/eui';
import { FormRow } from '../configuration/utils/form-row';
import { API_ENDPOINT_ACCOUNT_INFO } from './constants';
import { logout } from './utils';
import { CoreStart } from 'kibana/public';

interface PasswordResetPanelProps {
  coreStart: CoreStart;
  username: string;
  handleClose: () => void;
}

export function PasswordResetPanel(props: PasswordResetPanelProps) {
  const [currentPassword, setCurrentPassword] = useState<string>('');
  // reply on backend response of login call to verify
  const [isCurrentPasswordInvalid, setIsCurrentPasswordInvalid] = useState<boolean>(false);
  const [currentPasswordError, setCurrentPasswordError] = useState<string[]>([]);

  const [newPassword, setNewPassword] = useState<string>('');
  // reply on backend response of user update call to verify
  const [isNewPasswordInvalid, setIsNewPasswordInvalid] = useState<boolean>(false);
  const [newPasswordError, setNewPasswordError] = useState<string[]>([]);

  const [repeatNewPassword, setRepeatNewPassword] = useState<string>('');
  const [isRepeatNewPasswordInvalid, setIsRepeatNewPasswordInvalid] = useState<boolean>(false);

  const handleReset = async () => {
    const http = props.coreStart.http;
    // validate the current password
    try {
      await http.post('/auth/login', {
        body: JSON.stringify({
          username: props.username,
          password: currentPassword,
        }),
      });
    } catch (e) {
      setIsCurrentPasswordInvalid(true);
      setCurrentPasswordError(['Invalid current password due to error: ' + e?.body?.message]);
      return;
    }

    // update new password
    try {
      await http.post(`${API_ENDPOINT_ACCOUNT_INFO}`, {
        body: JSON.stringify({
          password: newPassword,
          current_password: currentPassword,
        }),
      });

      await logout(http);
    } catch (e) {
      setIsNewPasswordInvalid(true);
      setNewPasswordError(['Invalid new password due to error: ' + e?.body?.message]);
    }
  };

  // TODO: replace the instruction message for new password once UX provides it.
  return (
    <EuiOverlayMask>
      <EuiModal onClose={props.handleClose}>
        <EuiSpacer />
        <EuiModalBody>
          <EuiTitle>
            <h4>Reset password for &quot;{props.username}&quot;</h4>
          </EuiTitle>

          <EuiSpacer />

          <FormRow
            headerText="Current password"
            helpText="Verify your account by entering your current password"
            isInvalid={isCurrentPasswordInvalid}
            error={currentPasswordError}
          >
            <EuiFieldPassword
              onChange={function (e: React.ChangeEvent<HTMLInputElement>) {
                setCurrentPassword(e.target.value);
                setIsCurrentPasswordInvalid(false);
              }}
              isInvalid={isCurrentPasswordInvalid}
            />
          </FormRow>

          <FormRow
            headerText="New password"
            helpText="The password must contain from m to n characters. Valid characters are [for example lowercase a-z
            , 0-9, and - (hyphen)]"
            isInvalid={isNewPasswordInvalid}
            error={newPasswordError}
          >
            <EuiFieldPassword
              onChange={function (e: React.ChangeEvent<HTMLInputElement>) {
                setNewPassword(e.target.value);
                setIsNewPasswordInvalid(false);
                setIsRepeatNewPasswordInvalid(repeatNewPassword !== newPassword);
              }}
              isInvalid={isNewPasswordInvalid}
            />
          </FormRow>

          <FormRow
            headerText="Re-enter new password"
            helpText="The password must be identical to what you entered above"
          >
            <EuiFieldPassword
              isInvalid={isRepeatNewPasswordInvalid}
              onChange={function (e: React.ChangeEvent<HTMLInputElement>) {
                const value = e.target.value;
                setRepeatNewPassword(value);
                setIsRepeatNewPasswordInvalid(value !== newPassword);
              }}
            />
          </FormRow>
        </EuiModalBody>
        <EuiModalFooter>
          <EuiButtonEmpty onClick={props.handleClose}>Cancel</EuiButtonEmpty>

          <EuiButton fill disabled={isRepeatNewPasswordInvalid} onClick={handleReset}>
            Reset
          </EuiButton>
        </EuiModalFooter>
      </EuiModal>
    </EuiOverlayMask>
  );
}
