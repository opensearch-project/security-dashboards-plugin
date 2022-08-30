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
} from '@elastic/eui';
import { Console } from 'console';
import { CoreStart } from '../../../../../src/core/public';
import { ClientConfigType } from '../../types';
import defaultBrandImage from '../../assets/opensearch_logo_h.svg';
import { validateCurrentPassword, validateExternalAuth } from '../../utils/login-utils';

interface LoginPageDeps {
  http: CoreStart['http'];
  config: ClientConfigType['ui']['basicauth']['login'];
  authType: ClientConfigType['auth']['type'];
  configOp: ClientConfigType;
}

function redirect(serverBasePath: string) {
  // navigate to nextUrl
  console.log('fetch:: window.location.search:: ');
  console.log(window.location.search);

  const urlParams = new URLSearchParams(window.location.search);
  let nextUrl = urlParams.get('nextUrl');
  if (!nextUrl || nextUrl.toLowerCase().includes('//')) {
    // Appending the next url with trailing slash. We do so because in case the serverBasePath is empty, we can simply
    // redirect to '/'.
    nextUrl = serverBasePath + '/';
  }
  // console.log("nextUrl::");
  // console.log(nextUrl);
  // console.log("redirect window.location::");
  // console.log(window.location);
  window.location.href = nextUrl + window.location.hash;
}

export function LoginPage(props: LoginPageDeps) {
  const [username, setUsername] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [loginFailed, setloginFailed] = useState(false);
  const [externalLoginFailed, setExternalLoginFailed] = useState(false);
  const [usernameValidationFailed, setUsernameValidationFailed] = useState(false);
  const [passwordValidationFailed, setPasswordValidationFailed] = useState(false);
  // const [currentAuthType, setCurrentAuthType] = useState('');

  let errorLabel = null;
  if (loginFailed) {
    errorLabel = (
      <EuiText id="error" color="danger" textAlign="center">
        <b>Invalid username or password, please try again</b>
      </EuiText>
    );
  }

  if (externalLoginFailed) {
    errorLabel = (
      <EuiText id="error" color="danger" textAlign="center">
        <b>External Authentication failed, please try again</b>
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

    // setCurrentAuthType('basicauth');
    try {
      console.log('props::');
      console.log(props);
      console.log('currentAuthType::');
      // console.log(currentAuthType);

      await validateCurrentPassword(props.http, username, password);
      console.log('Redirect for Basic Auth::');
      console.log(props.http.basePath.serverBasePath);
      console.log('currentAuthType::');
      // console.log(currentAuthType);

      redirect(props.http.basePath.serverBasePath);
    } catch (error) {
      console.log(error);
      setloginFailed(true);
      return;
    }
  };
  /*
  const handleSocialSignInSubmit = async (e: any) => {
    e.preventDefault();

    // Clear errors
    setExternalLoginFailed(false);
    //setCurrentAuthType('openid');
    try {
      //console.log("currentAuthType::");
      //console.log(currentAuthType);
      await validateExternalAuth(props.http, currentAuthType);

      console.log("Redirect for OIDC Auth::");
      console.log(props.http.basePath.serverBasePath);
      redirect(props.http.basePath.serverBasePath);
    } catch (error) {
      console.log(error);
      setExternalLoginFailed(true);
      return;
    }
  };
*/
  const formOptions = (options: string) => {
    console.log('options:: ');
    console.log(options);
    if (!options) {
      options = 'basicauth';
    }
    const optArr = options.split(',');

    let formBody = [];
    const formBodyOp = [];
    for (let i = 0; i < optArr.length; i++) {
      switch (optArr[i]) {
        case 'basicauth':
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
                className={props.config.buttonstyle || 'btn-login'}
                onClick={handleSubmit}
              >
                Log In
              </EuiButton>
            </EuiFormRow>
          );
          if (optArr.length > 1) {
            formBody.push(<EuiSpacer size="s" />);
            formBody.push(
              <EuiText size="m" textAlign="center">
                Or
              </EuiText>
            );
            formBody.push(<EuiSpacer size="s" />);
          }
          break;
        case 'openid':
          formBodyOp.push(
            <EuiFormRow>
              <EuiButton
                // data-test-subj="submit"
                size="s"
                // type="prime"
                className={props.configOp.ui.openid.login.buttonstyle || 'btn-login'}
                // onClick={handleSocialSignInSubmit}
                href="/auth/openid/login"
                iconType={
                  props.configOp.ui.openid.login.showbrandimage
                    ? props.configOp.ui.openid.login.brandimage
                    : ''
                }
              >
                {props.configOp.ui.openid.login.buttonname}
              </EuiButton>
            </EuiFormRow>
          );
          break;
        case 'saml':
          formBodyOp.push(
            <EuiFormRow>
              <EuiButton
                // data-test-subj="submit"
                size="s"
                // type="submit"
                className={props.configOp.ui.saml.login.buttonstyle || 'btn-login'}
                // onClick={handleSocialSignInSubmit}
                href="/auth/saml/login"
                iconType={
                  props.configOp.ui.saml.login.showbrandimage
                    ? props.configOp.ui.saml.login.brandimage
                    : ''
                }
              >
                {props.configOp.ui.saml.login.buttonname}
              </EuiButton>
            </EuiFormRow>
          );
          break;
        default:
          formBody.push('');
          break;
      }
    }
    /*
    if(props.configOp.auth.anonymous_auth_enabled){
        formBodyOp.push  (
          <EuiFormRow>
          <EuiButton
            //data-test-subj="submit"
            size="s"
            //type="prime"
            className={props.configOp.ui.openid.login.buttonstyle || 'btn-login'}
            //onClick={handleSocialSignInSubmit}
            onClick={handleSubmit}
            //href="/auth/anonymous"
            iconType={props.configOp.ui.openid.login.showbrandimage? props.configOp.ui.openid.login.brandimage: ""}
          >
            Log In as Anonymous
          </EuiButton>
        </EuiFormRow>
        );
    }*/
    formBody = formBody.concat(formBodyOp);
    return formBody;
  };

  // TODO: Get brand image from server config
  return (
    <EuiListGroup className="login-wrapper">
      {props.config.showbrandimage && (
        <EuiImage size="fullWidth" alt="" url={props.config.brandimage || defaultBrandImage} />
      )}
      <EuiSpacer size="s" />
      <EuiText size="m" textAlign="center">
        {props.config.title || 'Please login to OpenSearch Dashboards'}
      </EuiText>
      <EuiSpacer size="s" />
      <EuiText size="s" textAlign="center">
        {props.config.subtitle ||
          'If you have forgotten your username or password, please ask your system administrator'}
      </EuiText>
      <EuiSpacer size="m" />
      <EuiForm component="form">
        {formOptions(props.authType)}
        {errorLabel}
      </EuiForm>
    </EuiListGroup>
  );
}
