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
import { EuiButtonEmpty } from '@elastic/eui';
import { HttpStart } from 'kibana/public';
import { logout } from './utils';

export function LogoutButton(props: { authType: string; http: HttpStart; divider: JSX.Element }) {
  if (props.authType === 'openid' || props.authType === 'saml') {
    return (
      <div>
        {props.divider}
        <EuiButtonEmpty color="danger" size="xs" href="/auth/logout">
          Log out
        </EuiButtonEmpty>
      </div>
    );
  } else if (props.authType === 'proxy') {
    return <div />;
  } else {
    return (
      <div>
        {props.divider}
        <EuiButtonEmpty color="danger" size="xs" onClick={() => logout(props.http)}>
          Log out
        </EuiButtonEmpty>
      </div>
    );
  }
}
