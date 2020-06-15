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

import React, { useEffect, useState } from 'react';

import {
  EuiDescribedFormGroup,
  EuiForm,
  EuiFormRow,
  EuiHorizontalRule,
  EuiPanel,
  EuiSwitch,
  EuiTitle,
} from '@elastic/eui';
import { AppDependencies } from '../../../types';
import { API_ENDPOINT_AUDITLOGGING } from '../../constants';

function renderStatusPanel(onSwitchChange: any, auditLoggingEnabled: boolean) {
  return (
    <EuiForm>
      <EuiDescribedFormGroup
        title={<h3>Enable audit logging</h3>}
        description={<>Enable or disable audit logging</>}
      >
        <EuiFormRow>
          <EuiSwitch
            name="auditLoggingEnabledSwitch"
            label={auditLoggingEnabled ? 'Enabled' : 'Disabled'}
            checked={auditLoggingEnabled}
            onChange={onSwitchChange}
          />
        </EuiFormRow>
      </EuiDescribedFormGroup>
    </EuiForm>
  );
}

export function AuditLogging(props: AppDependencies) {
  const [auditLoggingEnabled, setAuditLoggingEnabled] = useState<boolean>(false);

  const onSwitchChange = () => {
    setAuditLoggingEnabled((prevAuditLoggingEnabled) => !prevAuditLoggingEnabled);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const configuration = await props.coreStart.http.get(API_ENDPOINT_AUDITLOGGING);

        setAuditLoggingEnabled(configuration.data.config.enabled);
      } catch (e) {
        // TODO: switch to better error handling.
        console.log(e);
      }
    };

    fetchData();
  }, [props.coreStart.http]);

  const content = renderStatusPanel(onSwitchChange, auditLoggingEnabled);

  return (
    <EuiPanel>
      <EuiTitle>
        <h3>Audit logging</h3>
      </EuiTitle>
      <EuiHorizontalRule />
      {content}
    </EuiPanel>
  );
}
