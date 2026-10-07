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

import React, { useContext } from 'react';
import {
  EuiSmallButton,
  EuiFlexGroup,
  EuiFlexItem,
  EuiGlobalToastList,
  EuiPageHeader,
  EuiPanel,
  EuiSpacer,
  EuiText,
  EuiTitle,
} from '@elastic/eui';
import { Toast } from '@elastic/eui/src/components/toast/global_toast_list';
import { cloneDeep, set } from 'lodash';
import { AppDependencies } from '../../../types';
import { AuditLoggingSettings } from '../audit-logging/types';
import { SETTING_GROUPS } from './constants';
import { StandaloneAuditSettings } from './types';
import { EditSettingGroup } from '../audit-logging/edit-setting-group';
import { buildHashUrl, buildUrl } from '../../utils/url-builder';
import { ResourceType } from '../../../../../common';
import { getStandaloneAudit, updateStandaloneAudit } from '../../utils/standalone-audit-utils';
import { useToastState } from '../../utils/toast-utils';
import { setCrossPageToast } from '../../utils/storage-utils';
import { SecurityPluginTopNavMenu } from '../../top-nav-menu';
import { DataSourceContext } from '../../app-router';
import { getClusterInfo } from '../../../../utils/datasource-utils';
import { PageHeader } from '../../header/header-components';

interface StandaloneAuditEditSettingProps extends AppDependencies {
  setting: 'general' | 'compliance';
}

// EditSettingGroup is typed to AuditLoggingSettings; standalone config is structurally
// compatible for the fields rendered, so cast at the single call site.
const asEditableConfig = (config: StandaloneAuditSettings): AuditLoggingSettings =>
  config as unknown as AuditLoggingSettings;

export function StandaloneAuditEditSettings(props: StandaloneAuditEditSettingProps) {
  const dataSourceEnabled = !!props.depsStart.dataSource?.dataSourceEnabled;
  const [editConfig, setEditConfig] = React.useState<StandaloneAuditSettings>({});
  const [toasts, addToast, removeToast] = useToastState();
  const { dataSource, setDataSource } = useContext(DataSourceContext)!;

  const handleChange = (path: string, val: boolean | string[]) => {
    setEditConfig((previousEditedConfig) => {
      return set(cloneDeep(previousEditedConfig), path, val);
    });
  };

  React.useEffect(() => {
    const fetchConfig = async () => {
      try {
        const fetchedConfig = await getStandaloneAudit(props.coreStart.http, dataSource.id);
        setEditConfig(fetchedConfig);
      } catch (e) {
        console.error(e);
      }
    };

    fetchConfig();
  }, [props.coreStart.http, dataSource]);

  const renderSaveAndCancel = () => {
    return (
      <EuiFlexGroup justifyContent="flexEnd">
        <EuiFlexItem grow={false}>
          <EuiSmallButton
            data-test-subj="cancel"
            onClick={() => {
              window.location.assign(buildHashUrl(ResourceType.standaloneAudit));
            }}
          >
            Cancel
          </EuiSmallButton>
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiSmallButton
            data-test-subj="save"
            fill
            onClick={() => {
              saveConfig(editConfig);
            }}
          >
            Save
          </EuiSmallButton>
        </EuiFlexItem>
      </EuiFlexGroup>
    );
  };

  const saveConfig = async (configToUpdate: StandaloneAuditSettings) => {
    try {
      await updateStandaloneAudit(props.coreStart.http, configToUpdate, dataSource.id);

      const addSuccessToast = (text: string) => {
        const successToast: Toast = {
          id: 'update-result',
          color: 'success',
          iconType: 'check',
          title: 'Success',
          text,
        };
        setCrossPageToast(buildUrl(ResourceType.standaloneAudit), successToast);
      };

      if (props.setting === 'general') {
        addSuccessToast(`General settings saved ${getClusterInfo(dataSourceEnabled, dataSource)}`);
      } else {
        addSuccessToast(
          `Compliance settings saved ${getClusterInfo(dataSourceEnabled, dataSource)}`
        );
      }

      window.location.assign(buildHashUrl(ResourceType.standaloneAudit));
    } catch (e) {
      const failureToast: Toast = {
        id: 'update-result',
        color: 'danger',
        iconType: 'alert',
        title:
          `Failed to update standalone audit configuration ${getClusterInfo(
            dataSourceEnabled,
            dataSource
          )} due to ` + e?.message,
      };
      addToast(failureToast);
    } finally {
      window.scrollTo({ top: 0 });
    }
  };

  const renderComplianceSetting = () => {
    return (
      <>
        <PageHeader
          navigation={props.depsStart.navigation}
          coreStart={props.coreStart}
          fallBackComponent={
            <EuiPageHeader>
              <EuiTitle size="l">
                <h1>Compliance settings</h1>
              </EuiTitle>
            </EuiPageHeader>
          }
          resourceType={ResourceType.standaloneAudit}
          pageTitle="Compliance settings"
        />

        <EuiPanel>
          <EditSettingGroup
            settingGroup={SETTING_GROUPS.COMPLIANCE_CONFIG_MODE_SETTINGS}
            config={asEditableConfig(editConfig)}
            handleChange={handleChange}
          />
          {editConfig.compliance && editConfig.compliance.enabled && (
            <>
              <EuiSpacer />

              <EditSettingGroup
                settingGroup={SETTING_GROUPS.COMPLIANCE_SETTINGS_READ}
                config={asEditableConfig(editConfig)}
                handleChange={handleChange}
              />

              <EuiSpacer />

              <EditSettingGroup
                settingGroup={SETTING_GROUPS.COMPLIANCE_SETTINGS_WRITE}
                config={asEditableConfig(editConfig)}
                handleChange={handleChange}
              />
            </>
          )}
        </EuiPanel>

        <EuiSpacer />

        {renderSaveAndCancel()}

        <EuiGlobalToastList toasts={toasts} toastLifeTimeMs={10000} dismissToast={removeToast} />
      </>
    );
  };

  const renderGeneralSettings = () => {
    return (
      <>
        <PageHeader
          navigation={props.depsStart.navigation}
          coreStart={props.coreStart}
          fallBackComponent={
            <EuiPageHeader>
              <EuiText size="s">
                <h1>General settings</h1>
              </EuiText>
            </EuiPageHeader>
          }
          resourceType={ResourceType.standaloneAudit}
          pageTitle="General settings"
        />

        <EuiPanel>
          <EditSettingGroup
            settingGroup={SETTING_GROUPS.LAYER_SETTINGS}
            config={asEditableConfig(editConfig)}
            handleChange={handleChange}
          />
          <EuiSpacer size="xl" />
          <EditSettingGroup
            settingGroup={SETTING_GROUPS.ATTRIBUTE_SETTINGS}
            config={asEditableConfig(editConfig)}
            handleChange={handleChange}
          />
          <EuiSpacer size="xl" />
          <EditSettingGroup
            settingGroup={SETTING_GROUPS.IGNORE_SETTINGS}
            config={asEditableConfig(editConfig)}
            handleChange={handleChange}
          />
        </EuiPanel>
        <EuiSpacer />
        {renderSaveAndCancel()}

        <EuiGlobalToastList toasts={toasts} toastLifeTimeMs={10000} dismissToast={removeToast} />
      </>
    );
  };

  const content = props.setting === 'general' ? renderGeneralSettings() : renderComplianceSetting();

  return (
    <div className="panel-restrict-width">
      <SecurityPluginTopNavMenu
        {...props}
        dataSourcePickerReadOnly={true}
        setDataSource={setDataSource}
        selectedDataSource={dataSource}
      />
      {content}
    </div>
  );
}
