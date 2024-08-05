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

import {
  EuiButton,
  EuiCode,
  EuiDescribedFormGroup,
  EuiFlexGroup,
  EuiFlexItem,
  EuiForm,
  EuiFormRow,
  EuiHorizontalRule,
  EuiLoadingContent,
  EuiPageHeader,
  EuiPanel,
  EuiSpacer,
  EuiSwitch,
  EuiText,
  EuiTitle,
} from '@elastic/eui';
import React, { useContext } from 'react';
import { FormattedMessage } from '@osd/i18n/react';
import { DataSourceOption } from 'src/plugins/data_source_management/public';
import { AppDependencies } from '../../../types';
import { ResourceType } from '../../../../../common';
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
import { DataSourceContext } from '../../app-router';
import { SecurityPluginTopNavMenu } from '../../top-nav-menu';
import { AccessErrorComponent } from '../../access-error-component';

interface AuditLoggingProps extends AppDependencies {
  fromType: string;
}

function renderStatusPanel(onSwitchChange: () => void, auditLoggingEnabled: boolean) {
  return (
    <EuiPanel>
      <EuiForm>
        <EuiDescribedFormGroup title={<h3>Storage location</h3>} className="described-form-group">
          <EuiFormRow className="form-row">
            <EuiText color="subdued" grow={false}>
              <FormattedMessage
                id="audit.logs.storageInstruction"
                defaultMessage="Configure the output location and storage types in {opensearchCode}. The default storage location is {internalOpenSearchCode}, which stores the logs in an index on this cluster."
                values={{
                  opensearchCode: <EuiCode>opensearch.yml</EuiCode>,
                  internalOpenSearchCode: <EuiCode>internal_opensearch</EuiCode>,
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

function renderAccessErrorPanel(loading: boolean, dataSource: DataSourceOption) {
  return (
    <AccessErrorComponent
      loading={loading}
      dataSourceLabel={dataSource && dataSource.label}
      message="You do not have permissions to configure audit logging settings"
    />
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
  const { dataSource, setDataSource } = useContext(DataSourceContext)!;
  const [loading, setLoading] = React.useState(false);
  const [accessErrorFlag, setAccessErrorFlag] = React.useState(false);

  const getHeader = () => {
    if (props.coreStart.chrome.navGroup.getNavGroupEnabled()) {
      return <></>;
    } else {
      return (
        <EuiTitle size="l">
          <h3>Audit logging</h3>
        </EuiTitle>
      );
    }
  };

  const onSwitchChange = async () => {
    try {
      const updatedConfiguration = { ...configuration };
      updatedConfiguration.enabled = !updatedConfiguration.enabled;

      await updateAuditLogging(props.coreStart.http, updatedConfiguration, dataSource.id);

      setConfiguration(updatedConfiguration);
    } catch (e) {
      console.error(e);
    }
  };

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const auditLogging = await getAuditLogging(props.coreStart.http, dataSource.id);
        setConfiguration(auditLogging);
        setAccessErrorFlag(false);
      } catch (e) {
        // TODO: switch to better error handling.
        console.log(e);
        // requests with existing credentials but insufficient permissions result in 403, remote data-source requests with non-existing credentials result in 400
        if (e.response && [400, 403].includes(e.response.status)) {
          setAccessErrorFlag(true);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [props.coreStart.http, props.fromType, dataSource]);

  const statusPanel = renderStatusPanel(onSwitchChange, configuration.enabled || false);

  let content;

  if (accessErrorFlag) {
    content = renderAccessErrorPanel(loading, dataSource);
  } else if (!configuration.enabled) {
    content = statusPanel;
  } else {
    content = (
      <>
        {statusPanel}
        <EuiSpacer />
        <EuiPanel data-test-subj="general-settings">
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

  return (
    <div className="panel-restrict-width">
      <SecurityPluginTopNavMenu
        {...props}
        dataSourcePickerReadOnly={false}
        setDataSource={setDataSource}
        selectedDataSource={dataSource}
      />
      <EuiPageHeader>{getHeader()}</EuiPageHeader>
      <EuiSpacer />
      {loading ? <EuiLoadingContent /> : content}
    </div>
  );
}
