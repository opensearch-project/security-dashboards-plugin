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
  EuiButton,
  EuiFlexGroup,
  EuiFlexItem,
  EuiHorizontalRule,
  EuiPanel,
  EuiSpacer,
  EuiTitle,
} from '@elastic/eui';
import { AppDependencies } from '../../../types';
import { API_ENDPOINT_AUDITLOGGING } from '../../constants';
import {
  renderComplianceSettings,
  renderGeneralSettings,
  renderStatusPanel,
} from '../../utils/audit-logging-view-utils';

export function AuditLogging(props: AppDependencies) {
  // TODO: modify the logic when making the post calls for update.
  const [auditLoggingEnabled, setAuditLoggingEnabled] = useState<boolean>(false);
  const [configuration, setConfiguration] = useState<any>({});
  const onSwitchChange = () => {
    setAuditLoggingEnabled((prevAuditLoggingEnabled) => !prevAuditLoggingEnabled);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const rawConfiguration = await props.coreStart.http.get(API_ENDPOINT_AUDITLOGGING);

        setAuditLoggingEnabled(rawConfiguration.data.config.enabled);
        setConfiguration(rawConfiguration.data.config);
      } catch (e) {
        // TODO: switch to better error handling.
        console.log(e);
      }
    };

    fetchData();
  }, [props.coreStart.http]);

  const statusPanel = renderStatusPanel(onSwitchChange, auditLoggingEnabled);

  return (
    <>
      <EuiPanel>
        <EuiTitle>
          <h3>Audit logging</h3>
        </EuiTitle>
        <EuiHorizontalRule />
        {statusPanel}
      </EuiPanel>

      <EuiSpacer />

      <EuiPanel>
        <EuiFlexGroup>
          <EuiFlexItem>
            <EuiTitle>
              <h3>General settings</h3>
            </EuiTitle>
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiButton>Configure</EuiButton>
          </EuiFlexItem>
        </EuiFlexGroup>
        <EuiHorizontalRule />
        {renderGeneralSettings(configuration.audit || {})}
      </EuiPanel>

      <EuiSpacer />

      <EuiPanel>
        <EuiFlexGroup>
          <EuiFlexItem>
            <EuiTitle>
              <h3>Compliance settings</h3>
            </EuiTitle>
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiButton>Configure</EuiButton>
          </EuiFlexItem>
        </EuiFlexGroup>

        <EuiHorizontalRule />
        {renderComplianceSettings(configuration.compliance || {})}
      </EuiPanel>
    </>
  );
}
