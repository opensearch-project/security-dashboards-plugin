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

import React, { useState } from 'react';
import {
  EuiText,
  EuiFieldText,
  EuiIcon,
  EuiSpacer,
  EuiButton,
  EuiImage,
  EuiListGroup,
  EuiForm,
  EuiFormRow,
  EuiHorizontalRule,
} from '@elastic/eui';
import { CoreStart } from '../../../../../src/core/public';
import { ClientConfigType } from '../../types';
import defaultBrandImage from '../../assets/opensearch_logo_h.svg';
import { validateCurrentPassword } from '../../utils/login-utils';
import {
  AuthType,
  OPENID_AUTH_LOGIN,
  SAML_AUTH_LOGIN,
  SAML_AUTH_LOGIN_WITH_FRAGMENT,
  ANONYMOUS_AUTH_LOGIN,
} from '../../../common';

interface LoginPageDeps {
  http: CoreStart['http'];
  config: ClientConfigType;
}

function redirect(serverBasePath: string) {
  // navigate to nextUrl
  const urlParams = new URLSearchParams(window.location.search);
  let nextUrl = urlParams.get('nextUrl');
  if (!nextUrl || nextUrl.toLowerCase().includes('//')) {
    // Appending the next url with trailing slash. We do so because in case the serverBasePath is empty, we can simply
    // redirect to '/'.
    nextUrl = serverBasePath + '/';
  }
  window.location.href = nextUrl + window.location.hash;
}

export function LoginPage(props: LoginPageDeps) {
  const [username, setUsername] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [loginFailed, setloginFailed] = useState(false);
  const [loginError, setloginError] = useState('');
  const [usernameValidationFailed, setUsernameValidationFailed] = useState(false);
  const [passwordValidationFailed, setPasswordValidationFailed] = useState(false);

  let errorLabel: any = null;
  if (loginFailed) {
    errorLabel = (
      <EuiText id="error" color="danger" textAlign="center">
        <b>{loginError}</b>
      </EuiText>
    );
  }

  // @ts-ignore : Parameter 'e' implicitly has an 'any' type.
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Clear errors
    setloginFailed(false);
    setUsernameValidationFailed(false);
    setPasswordValidationFailed(false);

    // Form validation
    if (username === '') {
      setUsernameValidationFailed(true);
      return;
    }

    if (password === '') {
      setPasswordValidationFailed(true);
      return;
    }

    try {
      await validateCurrentPassword(props.http, username, password);
      redirect(props.http.basePath.serverBasePath);
    } catch (error) {
      console.log(error);
      setloginFailed(true);
      setloginError('Invalid username or password. Please try again.');
      return;
    }
  };

  const formOptions = (options: string | string[]) => {
    let formBody = [];
    const formBodyOp = [];
    let authOpts = [];

    if (typeof options === 'string') {
      if (options === '') {
        authOpts.push(AuthType.BASIC);
      } else {
        authOpts.push(options);
      }
    } else {
      if (options && options.length === 1 && options[0] === '') {
        authOpts.push(AuthType.BASIC);
      } else {
        authOpts = [...options];
      }
    }

    for (let i = 0; i < authOpts.length; i++) {
      switch (authOpts[i].toLowerCase()) {
        case AuthType.BASIC: {
          formBody.push(
            <EuiFormRow>
              <EuiFieldText
                data-test-subj="user-name"
                placeholder="Username"
                prepend={<EuiIcon type="user" />}
                onChange={(e) => setUsername(e.target.value)}
                value={username}
                isInvalid={usernameValidationFailed}
              />
            </EuiFormRow>
          );
          formBody.push(
            <EuiFormRow isInvalid={passwordValidationFailed}>
              <EuiFieldText
                data-test-subj="password"
                placeholder="Password"
                prepend={<EuiIcon type="lock" />}
                type="password"
                onChange={(e) => setPassword(e.target.value)}
                value={password}
                isInvalid={usernameValidationFailed}
              />
            </EuiFormRow>
          );
          formBody.push(
            <EuiFormRow>
              <EuiButton
                data-test-subj="submit"
                fill
                size="s"
                type="submit"
                className={props.config.ui.basicauth.login.buttonstyle || 'btn-login'}
                onClick={handleSubmit}
              >
                Log in
              </EuiButton>
            </EuiFormRow>
          );

          if (authOpts.length > 1) {
            formBody.push(<EuiSpacer size="xs" />);
            formBody.push(<EuiHorizontalRule size="full" margin="xl" />);
            formBody.push(<EuiSpacer size="xs" />);
          }
          break;
        }
        case AuthType.OPEN_ID: {
          formBodyOp.push(
            <EuiFormRow>
              <EuiButton
                data-test-subj="submit"
                size="s"
                type="prime"
                className={props.config.ui.openid.login.buttonstyle || 'btn-login'}
                onClick={(e: any) => {
                  e.preventDefault();
                  sessionStorage.setItem('current_auth_type', AuthType.OPEN_ID);
                  window.location.href = OPENID_AUTH_LOGIN;
                }}
                iconType={
                  props.config.ui.openid.login.showbrandimage
                    ? props.config.ui.openid.login.brandimage
                    : ''
                }
              >
                {props.config.ui.openid.login.buttonname}
              </EuiButton>
            </EuiFormRow>
          );
          break;
        }
        case AuthType.SAML: {
          formBodyOp.push(
            <EuiFormRow>
              <EuiButton
                data-test-subj="submit"
                size="s"
                type="submit"
                className={props.config.ui.saml.login.buttonstyle || 'btn-login'}
                onClick={(e: any) => {
                  e.preventDefault();
                  sessionStorage.setItem('current_auth_type', AuthType.SAML);
                  window.location.href = SAML_AUTH_LOGIN_WITH_FRAGMENT;
                }}
                iconType={
                  props.config.ui.saml.login.showbrandimage
                    ? props.config.ui.saml.login.brandimage
                    : ''
                }
              >
                {props.config.ui.saml.login.buttonname}
              </EuiButton>
            </EuiFormRow>
          );
          break;
        }
        default: {
          setloginFailed(true);
          setloginError(
            `Authentication Type: ${authOpts[i]} is not supported for multiple authentication.`
          );
          break;
        }
      }
    }

    formBody = formBody.concat(formBodyOp);
    return formBody;
  };

  // TODO: Get brand image from server config
  return (
    <EuiListGroup className="login-wrapper">
      {props.config.ui.basicauth.login.showbrandimage && (
        <EuiImage
          size="fullWidth"
          alt=""
          url={props.config.ui.basicauth.login.brandimage || defaultBrandImage}
        />
      )}
      <EuiSpacer size="s" />
      <EuiText size="m" textAlign="center">
        {props.config.ui.basicauth.login.title || 'Log in to OpenSearch Dashboards'}
      </EuiText>
      <EuiSpacer size="s" />
      <EuiText size="s" textAlign="center">
        {props.config.ui.basicauth.login.subtitle ||
          'If you have forgotten your username or password, contact your system administrator.'}
      </EuiText>
      <EuiSpacer size="s" />
      <EuiForm component="form">
        {formOptions(props.config.auth.type)}
        {errorLabel}
      </EuiForm>
    </EuiListGroup>
  );
}
