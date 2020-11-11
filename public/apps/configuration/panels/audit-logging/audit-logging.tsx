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

import {
  EuiButton,
  EuiCode,
  EuiDescribedFormGroup,
  EuiFlexGroup,
  EuiFlexItem,
  EuiForm,
  EuiFormRow,
  EuiHorizontalRule,
  EuiPanel,
  EuiSpacer,
  EuiSwitch,
  EuiText,
  EuiTitle,
} from '@elastic/eui';
import React from 'react';
import { FormattedMessage } from '@kbn/i18n/react';
import { AppDependencies } from '../../../types';
import { ResourceType } from '../../types';
import { getAuditLogging, updateAuditLogging } from '../../utils/audit-logging-utils';
import { displayBoolean, ExternalLink } from '../../utils/display-utils';
import { buildHashUrl } from '../../utils/url-builder';
import {
  SETTING_GROUPS,
  SUB_URL_FOR_COMPLIANCE_SETTINGS_EDIT,
  SUB_URL_FOR_GENERAL_SETTINGS_EDIT,
} from './constants';
import { AuditLoggingSettings } from './types';
import { ViewSettingGroup } from './view-setting-group';
import { DocLinks } from '../../constants';

interface AuditLoggingProps extends AppDependencies {
  fromType: string;
}

function renderStatusPanel(onSwitchChange: () => void, auditLoggingEnabled: boolean) {
  return (
    <EuiPanel>
      <EuiTitle>
        <h3>Audit logging</h3>
      </EuiTitle>
      <EuiHorizontalRule margin="m" />
      <EuiForm>
        <EuiDescribedFormGroup title={<h3>Storage location</h3>} className="described-form-group">
          <EuiFormRow className="form-row">
            <EuiText color="subdued" grow={false}>
              <FormattedMessage
                id="audit.logs.storageInstruction"
                defaultMessage="Configure the output location and storage types in {elasticsearchCode}. The default storage location is {internalElasticsearchCode}, which stores the logs in an index on this cluster."
                values={{
                  elasticsearchCode: <EuiCode>elasticsearch.yml</EuiCode>,
                  internalElasticsearchCode: <EuiCode>internal_elasticsearch</EuiCode>,
                }}
              />{' '}
              <ExternalLink href={DocLinks.AuditLogsStorageDoc} />
            </EuiText>
          </EuiFormRow>
        </EuiDescribedFormGroup>

        <EuiDescribedFormGroup
          title={<h3>Enable audit logging</h3>}
          className="described-form-group"
        >
          <EuiFormRow>
            <EuiSwitch
              data-test-subj="audit-logging-enabled-switch"
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

export function renderGeneralSettings(config: AuditLoggingSettings) {
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

export function renderComplianceSettings(config: AuditLoggingSettings) {
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
  const [configuration, setConfiguration] = React.useState<AuditLoggingSettings>({});

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

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const auditLogging = await getAuditLogging(props.coreStart.http);
        setConfiguration(auditLogging);
      } catch (e) {
        // TODO: switch to better error handling.
        console.log(e);
      }
    };

    fetchData();
  }, [props.coreStart.http, props.fromType]);

  const statusPanel = renderStatusPanel(onSwitchChange, configuration.enabled || false);

  let content;

  if (!configuration.enabled) {
    content = statusPanel;
  } else {
    content = (
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
                data-test-subj="general-settings-configure"
                onClick={() => {
                  window.location.href =
                    buildHashUrl(ResourceType.auditLogging) + SUB_URL_FOR_GENERAL_SETTINGS_EDIT;
                }}
              >
                Configure
              </EuiButton>
            </EuiFlexItem>
          </EuiFlexGroup>
          <EuiHorizontalRule margin="m" />
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
                data-test-subj="compliance-settings-configure"
                onClick={() => {
                  window.location.href =
                    buildHashUrl(ResourceType.auditLogging) + SUB_URL_FOR_COMPLIANCE_SETTINGS_EDIT;
                }}
              >
                Configure
              </EuiButton>
            </EuiFlexItem>
          </EuiFlexGroup>

          <EuiHorizontalRule margin="m" />
          {renderComplianceSettings(configuration)}
        </EuiPanel>
      </>
    );
  }

  return <div className="panel-restrict-width">{content}</div>;
}
