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
  EuiCode,
  EuiDescribedFormGroup,
  EuiFlexGroup,
  EuiFlexItem,
  EuiForm,
  EuiFormRow,
  EuiGlobalToastList,
  EuiHorizontalRule,
  EuiLink,
  EuiPanel,
  EuiSpacer,
  EuiSwitch,
  EuiText,
  EuiTitle,
} from '@elastic/eui';
import { Toast } from '@elastic/eui/src/components/toast/global_toast_list';
import { AppDependencies } from '../../../types';
import { API_ENDPOINT_AUDITLOGGING } from '../../constants';
import { AuditLoggingSettings } from './types';
import {
  FROM_COMPLIANCE_SAVE_SUCCESS,
  FROM_GENERAL_SAVE_SUCCESS,
  SETTING_GROUPS,
  SUB_URL_FOR_COMPLIANCE_SETTINGS_EDIT,
  SUB_URL_FOR_GENERAL_SETTINGS_EDIT,
} from './constants';
import { buildHashUrl } from '../../utils/url-builder';
import { ResourceType } from '../../types';
import { useToastState } from '../../utils/toast-utils';
import { displayBoolean } from '../../utils/display-utils';
import { ViewSettingGroup } from './view-setting-group';
import { updateAuditLogging } from '../../utils/audit-logging-utils';
import './_index.scss';

interface AuditLoggingProps extends AppDependencies {
  fromType: string;
}

function renderStatusPanel(onSwitchChange: () => void, auditLoggingEnabled: boolean) {
  return (
    <EuiPanel>
      <EuiTitle>
        <h3>Audit logging</h3>
      </EuiTitle>
      <EuiHorizontalRule />
      <EuiForm>
        <EuiDescribedFormGroup title={<h3>Storage location</h3>} className="described-form-group">
          <EuiFormRow className="form-row">
            <EuiText color="subdued" grow={false}>
              Configure the output location and storage types in{' '}
              <EuiCode>elasticsearch.yml</EuiCode>. The default storage location is{' '}
              <EuiCode>internal_elasticsearch</EuiCode>, which stores the logs in an index on this
              cluster.{' '}
              <EuiLink external={true} href="/">
                Learn more
              </EuiLink>
            </EuiText>
          </EuiFormRow>
        </EuiDescribedFormGroup>

        <EuiDescribedFormGroup
          title={<h3>Enable audit logging</h3>}
          className="described-form-group"
        >
          <EuiFormRow>
            <EuiSwitch
              name="auditLoggingEnabledSwitch"
              label={displayBoolean(auditLoggingEnabled)}
              checked={auditLoggingEnabled}
              onChange={onSwitchChange}
            />
          </EuiFormRow>
        </EuiDescribedFormGroup>
      </EuiForm>
    </EuiPanel>
  );
}

function renderGeneralSettings(config: AuditLoggingSettings) {
  return (
    <>
      <ViewSettingGroup config={config} settingGroup={SETTING_GROUPS.LAYER_SETTINGS} />

      <EuiSpacer />

      <ViewSettingGroup config={config} settingGroup={SETTING_GROUPS.ATTRIBUTE_SETTINGS} />

      <EuiSpacer />

      <ViewSettingGroup config={config} settingGroup={SETTING_GROUPS.IGNORE_SETTINGS} />
    </>
  );
}

function renderComplianceSettings(config: AuditLoggingSettings) {
  return (
    <>
      <ViewSettingGroup
        config={config}
        settingGroup={SETTING_GROUPS.COMPLIANCE_CONFIG_MODE_SETTINGS}
      />

      <EuiSpacer />

      <ViewSettingGroup config={config} settingGroup={SETTING_GROUPS.COMPLIANCE_CONFIG_SETTINGS} />

      <EuiSpacer />

      <ViewSettingGroup config={config} settingGroup={SETTING_GROUPS.COMPLIANCE_SETTINGS_READ} />

      <EuiSpacer />

      <ViewSettingGroup config={config} settingGroup={SETTING_GROUPS.COMPLIANCE_SETTINGS_WRITE} />

      <EuiSpacer />
    </>
  );
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
        {renderGeneralSettings(configuration)}
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
        {renderComplianceSettings(configuration)}
      </EuiPanel>

      <EuiGlobalToastList toasts={toasts} toastLifeTimeMs={10000} dismissToast={removeToast} />
    </>
  );
}
