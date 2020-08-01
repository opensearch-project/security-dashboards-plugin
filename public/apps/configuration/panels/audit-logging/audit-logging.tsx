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
  EuiGlobalToastList,
  EuiHorizontalRule,
  EuiPanel,
  EuiSpacer,
  EuiTitle,
} from '@elastic/eui';
import { Toast } from '@elastic/eui/src/components/toast/global_toast_list';
import { AppDependencies } from '../../../types';
import { API_ENDPOINT_AUDITLOGGING } from '../../constants';
import {
  renderComplianceSettings,
  renderGeneralSettings,
  renderStatusPanel,
  updateAuditLogging,
} from '../../utils/audit-logging-view-utils';
import { AuditLoggingSettings } from './types';
import {
  FROM_COMPLIANCE_SAVE_SUCCESS,
  FROM_GENERAL_SAVE_SUCCESS,
  SUB_URL_FOR_COMPLIANCE_SETTINGS_EDIT,
  SUB_URL_FOR_GENERAL_SETTINGS_EDIT,
} from './constants';
import { buildHashUrl } from '../../utils/url-builder';
import { ResourceType } from '../../types';
import { useToastState } from '../../utils/toast-utils';

interface AuditLoggingProps extends AppDependencies {
  fromType: string;
}

export function AuditLogging(props: AuditLoggingProps) {
  const [configuration, setConfiguration] = useState<AuditLoggingSettings>({});
  const [toasts, addToast, removeToast] = useToastState();

  const onSwitchChange = async () => {
    try {
      const updatedConfiguration = { ...configuration };
      updatedConfiguration.enabled = !updatedConfiguration.enabled;

      await updateAuditLogging(props.coreStart.http, updatedConfiguration);

      setConfiguration(updatedConfiguration);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const rawConfiguration = await props.coreStart.http.get(API_ENDPOINT_AUDITLOGGING);
        setConfiguration(rawConfiguration.config);
      } catch (e) {
        // TODO: switch to better error handling.
        console.log(e);
      }
    };

    const addSuccessToast = (text: string) => {
      const successToast: Toast = {
        id: 'update-result',
        color: 'success',
        iconType: 'check',
        title: 'Success',
        text,
      };

      addToast(successToast);
    };

    fetchData();

    if (props.fromType) {
      // Need to display success toast

      if (FROM_GENERAL_SAVE_SUCCESS.endsWith(props.fromType)) {
        addSuccessToast('General settings saved');
      } else if (FROM_COMPLIANCE_SAVE_SUCCESS.endsWith(props.fromType)) {
        addSuccessToast('Compliance settings saved');
      }
    }
  }, [addToast, props.coreStart.http, props.fromType]);

  const statusPanel = renderStatusPanel(onSwitchChange, configuration.enabled || false);

  if (!configuration.enabled) {
    return statusPanel;
  }

  return (
    <>
      {statusPanel}

      <EuiSpacer />

      <EuiPanel>
        <EuiFlexGroup>
          <EuiFlexItem>
            <EuiTitle>
              <h3>General settings</h3>
            </EuiTitle>
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiButton
              onClick={() => {
                window.location.href =
                  buildHashUrl(ResourceType.auditLogging) + SUB_URL_FOR_GENERAL_SETTINGS_EDIT;
              }}
            >
              Configure
            </EuiButton>
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
            <EuiButton
              onClick={() => {
                window.location.href =
                  buildHashUrl(ResourceType.auditLogging) + SUB_URL_FOR_COMPLIANCE_SETTINGS_EDIT;
              }}
            >
              Configure
            </EuiButton>
          </EuiFlexItem>
        </EuiFlexGroup>

        <EuiHorizontalRule />
        {renderComplianceSettings(configuration.compliance || {})}
      </EuiPanel>

      <EuiGlobalToastList toasts={toasts} toastLifeTimeMs={10000} dismissToast={removeToast} />
    </>
  );
}
