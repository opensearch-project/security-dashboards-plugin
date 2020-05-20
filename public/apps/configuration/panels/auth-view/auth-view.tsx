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

import React from 'react';
import { EuiButton, EuiPageHeader, EuiSpacer, EuiTitle } from '@elastic/eui';
import { AuthenticationSequencePanel } from './authentication-sequence-panel';
import { AuthorizationPanel } from './authorization-panel';

export function AuthView(props: {}) {
  return (
    <>
      <EuiPageHeader>
        <EuiTitle size="l">
          <h1>Authentication and authorization</h1>
        </EuiTitle>
        <EuiButton iconType="popout" iconSide="right">
          Manage via config.yml
        </EuiButton>
      </EuiPageHeader>
      <AuthenticationSequencePanel />
      <EuiSpacer size="m" />
      <AuthorizationPanel />
    </>
  );
}
