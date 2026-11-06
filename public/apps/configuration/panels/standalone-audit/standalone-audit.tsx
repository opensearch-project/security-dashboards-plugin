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
  EuiSmallButton,
  EuiDescribedFormGroup,
  EuiFlexGroup,
  EuiFlexItem,
  EuiForm,
  EuiCompressedFormRow,
  EuiHorizontalRule,
  EuiLoadingContent,
  EuiPageHeader,
  EuiPanel,
  EuiSpacer,
  EuiCompressedSwitch,
  EuiText,
  EuiTitle,
} from '@elastic/eui';
import React, { useContext } from 'react';
import { AppDependencies } from '../../../types';
import { ResourceType } from '../../../../../common';
import { AuditLoggingSettings } from '../audit-logging/types';
import { getStandaloneAudit, updateStandaloneAudit } from '../../utils/standalone-audit-utils';
import { displayBoolean } from '../../utils/display-utils';
import { buildHashUrl } from '../../utils/url-builder';
import {
  SETTING_GROUPS,
  SUB_URL_FOR_COMPLIANCE_SETTINGS_EDIT,
  SUB_URL_FOR_GENERAL_SETTINGS_EDIT,
} from './constants';
import { StandaloneAuditSettings } from './types';
import { ViewSettingGroup } from '../audit-logging/view-setting-group';
import { DataSourceContext } from '../../app-router';
import { SecurityPluginTopNavMenu } from '../../top-nav-menu';
import { PageHeader } from '../../header/header-components';

interface StandaloneAuditProps extends AppDependencies {
  fromType: string;
}

// The setting-group renderers are typed to AuditLoggingSettings; the standalone config is
// structurally compatible for the fields we render, so cast at the single call site.
const asRenderableConfig = (config: StandaloneAuditSettings): AuditLoggingSettings =>
  config as unknown as AuditLoggingSettings;

export function renderGeneralSettings(config: StandaloneAuditSettings) {
  return (
    <>
      <ViewSettingGroup
        config={asRenderableConfig(config)}
        settingGroup={SETTING_GROUPS.LAYER_SETTINGS}
      />

      <EuiSpacer />

      <ViewSettingGroup
        config={asRenderableConfig(config)}
        settingGroup={SETTING_GROUPS.ATTRIBUTE_SETTINGS}
      />

      <EuiSpacer />

      <ViewSettingGroup
        config={asRenderableConfig(config)}
        settingGroup={SETTING_GROUPS.IGNORE_SETTINGS}
      />
    </>
  );
}

export function renderComplianceSettings(config: StandaloneAuditSettings) {
  return (
    <>
      <ViewSettingGroup
        config={asRenderableConfig(config)}
        settingGroup={SETTING_GROUPS.COMPLIANCE_CONFIG_MODE_SETTINGS}
      />

      <EuiSpacer />

      <ViewSettingGroup
        config={asRenderableConfig(config)}
        settingGroup={SETTING_GROUPS.COMPLIANCE_SETTINGS_READ}
      />

      <EuiSpacer />

      <ViewSettingGroup
        config={asRenderableConfig(config)}
        settingGroup={SETTING_GROUPS.COMPLIANCE_SETTINGS_WRITE}
      />

      <EuiSpacer />
    </>
  );
}

function renderStatusPanel(onSwitchChange: () => void, auditLoggingEnabled: boolean) {
  return (
    <EuiPanel>
      <EuiForm>
        <EuiDescribedFormGroup title={<h3>Storage location</h3>} className="described-form-group">
          <EuiCompressedFormRow className="form-row">
            <EuiText color="subdued" grow={false} size="s">
              Configure the audit output location and storage type in opensearch.yml
              (plugins.security.audit.type). In standalone mode, audit settings are managed as
              cluster settings and take effect without a node restart.
            </EuiText>
          </EuiCompressedFormRow>
        </EuiDescribedFormGroup>

        <EuiDescribedFormGroup
          title={<h3>Enable standalone audit logging</h3>}
          className="described-form-group"
        >
          <EuiCompressedFormRow>
            <EuiCompressedSwitch
              data-test-subj="standalone-audit-enabled-switch"
              name="standaloneAuditEnabledSwitch"
              label={displayBoolean(auditLoggingEnabled)}
              checked={auditLoggingEnabled}
              onChange={onSwitchChange}
            />
          </EuiCompressedFormRow>
        </EuiDescribedFormGroup>
      </EuiForm>
    </EuiPanel>
  );
}

export function StandaloneAudit(props: StandaloneAuditProps) {
  const [configuration, setConfiguration] = React.useState<StandaloneAuditSettings>({});
  const { dataSource, setDataSource } = useContext(DataSourceContext)!;
  const [loading, setLoading] = React.useState(false);

  const onSwitchChange = async () => {
    try {
      const updatedConfiguration = { ...configuration, enabled: !configuration.enabled };
      await updateStandaloneAudit(props.coreStart.http, updatedConfiguration, dataSource.id);
      setConfiguration(updatedConfiguration);
    } catch (e) {
      console.error(e);
    }
  };

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const auditLogging = await getStandaloneAudit(props.coreStart.http, dataSource.id);
        setConfiguration(auditLogging);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [props.coreStart.http, props.fromType, dataSource]);

  const statusPanel = renderStatusPanel(onSwitchChange, configuration.enabled || false);

  let content;

  if (!configuration.enabled) {
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
              <EuiSmallButton
                data-test-subj="general-settings-configure"
                onClick={() => {
                  window.location.assign(
                    buildHashUrl(ResourceType.standaloneAudit) + SUB_URL_FOR_GENERAL_SETTINGS_EDIT
                  );
                }}
              >
                Configure
              </EuiSmallButton>
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
              <EuiSmallButton
                data-test-subj="compliance-settings-configure"
                onClick={() => {
                  window.location.assign(
                    buildHashUrl(ResourceType.standaloneAudit) +
                      SUB_URL_FOR_COMPLIANCE_SETTINGS_EDIT
                  );
                }}
              >
                Configure
              </EuiSmallButton>
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
      <PageHeader
        coreStart={props.coreStart}
        navigation={props.depsStart.navigation}
        fallBackComponent={
          <>
            <EuiPageHeader>
              <EuiText size="s">
                <h1>Standalone audit logging</h1>
              </EuiText>
            </EuiPageHeader>
            <EuiSpacer />
          </>
        }
        resourceType={ResourceType.standaloneAudit}
      />
      {loading ? <EuiLoadingContent /> : content}
    </div>
  );
}
