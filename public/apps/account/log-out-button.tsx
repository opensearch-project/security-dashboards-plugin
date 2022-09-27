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
import { EuiButtonEmpty } from '@elastic/eui';
import { HttpStart } from 'opensearch-dashboards/public';
import { logout, samlLogout } from './utils';

export function LogoutButton(props: {
  authType: string;
  http: HttpStart;
  divider: JSX.Element;
  logoutUrl?: string;
}) {
  if (props.authType === 'openid') {
    return (
      <div>
        {props.divider}
        <EuiButtonEmpty
          data-test-subj="log-out-2"
          color="danger"
          size="xs"
          href={`${props.http.basePath.serverBasePath}/auth/logout`}
        >
          Log out
        </EuiButtonEmpty>
      </div>
    );
  } else if (props.authType === 'saml') {
    return (
      <div>
        {props.divider}
        <EuiButtonEmpty
          data-test-subj="log-out-1"
          color="danger"
          size="xs"
          onClick={() => samlLogout(props.http)}
        >
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
        <EuiButtonEmpty
          data-test-subj="log-out-3"
          color="danger"
          size="xs"
          onClick={() => logout(props.http, props.logoutUrl)}
        >
          Log out
        </EuiButtonEmpty>
      </div>
    );
  }
}
