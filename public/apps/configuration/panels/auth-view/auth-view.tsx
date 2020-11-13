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
import { EuiPageHeader, EuiSpacer, EuiTitle } from '@elastic/eui';
import { isEmpty } from 'lodash';
import { AuthenticationSequencePanel } from './authentication-sequence-panel';
import { AuthorizationPanel } from './authorization-panel';
import { DocLinks } from '../../constants';
import { AppDependencies } from '../../../types';
import { ExternalLinkButton } from '../../utils/display-utils';
import { getSecurityConfig } from '../../utils/auth-view-utils';
import { InstructionView } from './instruction-view';

export function AuthView(props: AppDependencies) {
  const [authentication, setAuthentication] = React.useState([]);
  const [authorization, setAuthorization] = React.useState([]);
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const config = await getSecurityConfig(props.coreStart.http);

        setAuthentication(config.authc);
        setAuthorization(config.authz);
      } catch (e) {
        console.log(e);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [props.coreStart.http]);

  if (isEmpty(authentication)) {
    return <InstructionView config={props.config} />;
  }

  return (
    <>
      <EuiPageHeader>
        <EuiTitle size="l">
          <h1>Authentication and authorization</h1>
        </EuiTitle>
        {props.config.ui.backend_configurable && (
          <ExternalLinkButton
            href={DocLinks.BackendConfigurationDoc}
            text="Manage via config.yml"
          />
        )}
      </EuiPageHeader>
      {/* @ts-ignore */}
      <AuthenticationSequencePanel authc={authentication} loading={loading} />
      <EuiSpacer size="m" />
      {/* @ts-ignore */}
      <AuthorizationPanel authz={authorization} loading={loading} config={props.config} />
    </>
  );
}
