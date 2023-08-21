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
import {
  EuiButton,
  EuiButtonEmpty,
  EuiCallOut,
  EuiFieldPassword,
  EuiModal,
  EuiModalBody,
  EuiModalFooter,
  EuiOverlayMask,
  EuiSpacer,
  EuiTitle,
} from '@elastic/eui';
import { CoreStart } from 'opensearch-dashboards/public';
import { FormRow } from '../configuration/utils/form-row';
import { logout, updateNewPassword } from './utils';
import { PASSWORD_INSTRUCTION } from '../apps-constants';
import { constructErrorMessageAndLog } from '../error-utils';
import { validateCurrentPassword } from '../../utils/login-utils';
import { getDashboardsInfo } from '../../utils/dashboards-info-utils';

interface PasswordResetPanelProps {
  coreStart: CoreStart;
  username: string;
  handleClose: () => void;
  logoutUrl?: string;
}

export function PasswordResetPanel(props: PasswordResetPanelProps) {
  const [currentPassword, setCurrentPassword] = React.useState<string>('');
  // reply on backend response of login call to verify
  const [isCurrentPasswordInvalid, setIsCurrentPasswordInvalid] = React.useState<boolean>(false);
  const [currentPasswordError, setCurrentPasswordError] = React.useState<string[]>([]);

  const [newPassword, setNewPassword] = React.useState<string>('');
  // reply on backend response of user update call to verify
  const [isNewPasswordInvalid, setIsNewPasswordInvalid] = React.useState<boolean>(false);

  const [repeatNewPassword, setRepeatNewPassword] = React.useState<string>('');
  const [isRepeatNewPasswordInvalid, setIsRepeatNewPasswordInvalid] = React.useState<boolean>(
    false
  );

  const [errorCallOut, setErrorCallOut] = React.useState<string>('');

  const [passwordHelpText, setPasswordHelpText] = React.useState<string>(PASSWORD_INSTRUCTION);

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        setPasswordHelpText(
          (await getDashboardsInfo(props.coreStart.http)).password_validation_error_message
        );
      } catch (e) {
        console.error(e);
      }
    };

    fetchData();
  }, [props.coreStart.http]);

  const handleReset = async () => {
    const http = props.coreStart.http;
    // validate the current password
    try {
      await validateCurrentPassword(http, props.username, currentPassword);
    } catch (e) {
      setIsCurrentPasswordInvalid(true);
      setCurrentPasswordError([constructErrorMessageAndLog(e, 'Invalid current password.')]);
    }

    // update new password
    try {
      await updateNewPassword(http, newPassword, currentPassword);

      await logout(http, props.logoutUrl);
    } catch (e) {
      setErrorCallOut(constructErrorMessageAndLog(e, 'Failed to reset password.'));
    }
  };

  // TODO: replace the instruction message for new password once UX provides it.
  return (
    <EuiOverlayMask>
      <EuiModal data-test-subj="reset-password-modal" onClose={props.handleClose}>
        <EuiSpacer />
        <EuiModalBody>
          <EuiTitle>
            <h4>Reset password for &quot;{props.username}&quot;</h4>
          </EuiTitle>

          <EuiSpacer />

          <FormRow
            headerText="Current password"
            helpText="Verify your account by entering your current password."
            isInvalid={isCurrentPasswordInvalid}
            error={currentPasswordError}
          >
            <EuiFieldPassword
              data-test-subj="current-password"
              onChange={function (e: React.ChangeEvent<HTMLInputElement>) {
                setCurrentPassword(e.target.value);
                setIsCurrentPasswordInvalid(false);
              }}
              isInvalid={isCurrentPasswordInvalid}
            />
          </FormRow>

          <FormRow
            headerText="New password"
            helpText={passwordHelpText}
            isInvalid={isNewPasswordInvalid}
          >
            <EuiFieldPassword
              data-test-subj="new-password"
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
            helpText="The password must be identical to what you entered above."
          >
            <EuiFieldPassword
              data-test-subj="reenter-new-password"
              isInvalid={isRepeatNewPasswordInvalid}
              onChange={function (e: React.ChangeEvent<HTMLInputElement>) {
                const value = e.target.value;
                setRepeatNewPassword(value);
                setIsRepeatNewPasswordInvalid(value !== newPassword);
              }}
            />
          </FormRow>

          <EuiSpacer />

          {errorCallOut && (
            <EuiCallOut color="danger" iconType="alert">
              {errorCallOut}
            </EuiCallOut>
          )}
        </EuiModalBody>
        <EuiModalFooter>
          <EuiButtonEmpty data-test-subj="cancel" onClick={props.handleClose}>
            Cancel
          </EuiButtonEmpty>

          <EuiButton
            data-test-subj="reset"
            fill
            disabled={isRepeatNewPasswordInvalid}
            onClick={handleReset}
          >
            Reset
          </EuiButton>
        </EuiModalFooter>
      </EuiModal>
    </EuiOverlayMask>
  );
}
