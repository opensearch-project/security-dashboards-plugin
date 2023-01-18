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

import { EuiCode, EuiSpacer, EuiText, EuiTitle } from '@elastic/eui';
import React from 'react';
import { ClientConfigType } from '../../../../types';
import { ExternalLinkButton } from '../../utils/display-utils';
import { DocLinks } from '../../constants';

export function InstructionView(props: { config: ClientConfigType }) {
  return (
    <>
      <EuiTitle size="l">
        <h1>Authentication and authorization</h1>
      </EuiTitle>

      <EuiSpacer size="xxl" />

      <EuiText textAlign="center">
        <h2>You have not set up authentication and authorization</h2>
      </EuiText>

      <EuiText textAlign="center" size="xs" color="subdued" className="instruction-text">
        In order to use Security plugin, you must decide on authentication <EuiCode>authc</EuiCode>{' '}
        and authorization backends <EuiCode>authz</EuiCode>. Use{' '}
        <EuiCode>config/opensearch-security/config.yml</EuiCode> to define how to retrieve and
        verify the user credentials, and how to fetch additional roles from backend system if
        needed.
      </EuiText>

      <EuiSpacer />

      {props.config.ui.backend_configurable && (
        <div style={{ textAlign: 'center' }}>
          <ExternalLinkButton
            fill
            size="s"
            href={DocLinks.BackendConfigurationDoc}
            text="Create config.yml"
          />
        </div>
      )}
    </>
  );
}
