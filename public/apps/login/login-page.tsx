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

import React, { Component, useState } from 'react';
import {
  EuiText,
  EuiFieldText,
  EuiIcon,
  EuiSpacer,
  EuiButton,
  EuiImage,
  EuiListGroup,
  // @ts-ignore
  EuiForm,
} from '@elastic/eui';
import { CoreStart } from '../../../../../src/core/public';

interface LoginPageDeps {
  appBasePath: string;
  http: CoreStart['http'];
}

export function LoginPage(props: LoginPageDeps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginFailed, setloginFailed] = useState(false);

  let errorLabel = null;
  if (loginFailed) {
    errorLabel = (
      <EuiText id="error" color="danger" textAlign="center">
        <b>Invalid username or password, please try again</b>
      </EuiText>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setloginFailed(false);

    try {
      const response = await props.http.post('auth/login', {
        body: JSON.stringify({
          username: username,
          password: password,
        }),
      });
      // TODO: Parse nextUrl from paras
      window.location.href = props.appBasePath + '/..';
    } catch (error) {
      console.log(error);
      setloginFailed(true);
      return;
    }
  };

  // TODO: Get brand image from server config
  return (
    <EuiListGroup className="login-wrapper">
      <EuiImage alt="" url="" />
      <EuiSpacer size="s" />
      <EuiText size="m" textAlign="center">
        Please login to Kibana
      </EuiText>
      <EuiSpacer size="s" />
      <EuiText size="s" textAlign="center">
        If you have forgotten your username or password, please ask your system administrator
      </EuiText>
      <EuiSpacer size="s" />
      <EuiForm>
        <EuiFieldText
          placeholder="Username"
          prepend={<EuiIcon type="user" />}
          onChange={e => setUsername(e.target.value)}
          value={username}
        />
        <EuiSpacer size="s" />
        <EuiFieldText
          placeholder="Password"
          prepend={<EuiIcon type="lock" />}
          type="password"
          onChange={e => setPassword(e.target.value)}
          value={password}
        />
        <EuiSpacer size="s" />
        <EuiButton fill size="s" type="submit" className="btn-login" onClick={handleSubmit}>
          Log In
        </EuiButton>
        <EuiSpacer size="s" />
        {errorLabel}
      </EuiForm>
    </EuiListGroup>
  );
}
