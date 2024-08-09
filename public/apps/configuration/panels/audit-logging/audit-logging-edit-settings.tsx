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
  EuiTitle,
} from '@elastic/eui';
import { Toast } from '@elastic/eui/src/components/toast/global_toast_list';
import { cloneDeep, set, without } from 'lodash';
import { AppDependencies } from '../../../types';
import { SETTING_GROUPS, SettingMapItem } from './constants';
import { EditSettingGroup } from './edit-setting-group';
import { AuditLoggingSettings } from './types';
import { buildHashUrl, buildUrl } from '../../utils/url-builder';
import { ResourceType } from '../../../../../common';
import { getAuditLogging, updateAuditLogging } from '../../utils/audit-logging-utils';
import { useToastState } from '../../utils/toast-utils';
import { setCrossPageToast } from '../../utils/storage-utils';
import { SecurityPluginTopNavMenu } from '../../top-nav-menu';
import { DataSourceContext } from '../../app-router';
import { getClusterInfo } from '../../../../utils/datasource-utils';
import { PageHeader } from '../../header/header-components';

interface AuditLoggingEditSettingProps extends AppDependencies {
  setting: 'general' | 'compliance';
}

export function AuditLoggingEditSettings(props: AuditLoggingEditSettingProps) {
  const dataSourceEnabled = !!props.depsStart.dataSource?.dataSourceEnabled;
  const [editConfig, setEditConfig] = React.useState<AuditLoggingSettings>({});
  const [toasts, addToast, removeToast] = useToastState();
  const [invalidSettings, setInvalidSettings] = React.useState<string[]>([]);
  const { dataSource, setDataSource } = useContext(DataSourceContext)!;

  const handleChange = (path: string, val: boolean | string[] | SettingMapItem) => {
    setEditConfig((previousEditedConfig) => {
      return set(cloneDeep(editConfig), path, val);
    });
  };

  const handleInvalid = (path: string, error: boolean) => {
    const invalid = without(invalidSettings, path);

    if (error) {
      invalid.push(path);
    }
    setInvalidSettings(invalid);
  };

  React.useEffect(() => {
    const fetchConfig = async () => {
      try {
        const fetchedConfig = await getAuditLogging(props.coreStart.http, dataSource.id);
        setEditConfig(fetchedConfig);
      } catch (e) {
        console.log(e);
      }
    };

    fetchConfig();
  }, [props.coreStart.http, dataSource]);

  const renderSaveAndCancel = () => {
    return (
      <>
        <EuiFlexGroup justifyContent="flexEnd">
          <EuiFlexItem grow={false}>
            <EuiSmallButton
              data-test-subj="cancel"
              onClick={() => {
                window.location.href = buildHashUrl(ResourceType.auditLogging);
              }}
            >
              Cancel
            </EuiSmallButton>
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiSmallButton
              data-test-subj="save"
              fill
              isDisabled={invalidSettings.length !== 0}
              onClick={() => {
                saveConfig(editConfig);
              }}
            >
              Save
            </EuiSmallButton>
          </EuiFlexItem>
        </EuiFlexGroup>
      </>
    );
  };

  const saveConfig = async (configToUpdate: AuditLoggingSettings) => {
    try {
      await updateAuditLogging(props.coreStart.http, configToUpdate, dataSource.id);

      const addSuccessToast = (text: string) => {
        const successToast: Toast = {
          id: 'update-result',
          color: 'success',
          iconType: 'check',
          title: 'Success',
          text,
        };

        setCrossPageToast(buildUrl(ResourceType.auditLogging), successToast);
      };

      if (props.setting === 'general') {
        addSuccessToast(`General settings saved ${getClusterInfo(dataSourceEnabled, dataSource)}`);
      } else {
        addSuccessToast(
          `Compliance settings saved ${getClusterInfo(dataSourceEnabled, dataSource)}`
        );
      }

      window.location.href = buildHashUrl(ResourceType.auditLogging);
    } catch (e) {
      const failureToast: Toast = {
        id: 'update-result',
        color: 'danger',
        iconType: 'alert',
        title:
          `Failed to update audit configuration ${getClusterInfo(
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
          resourceType={ResourceType.auditLogging}
          pageTitle="Compliance settings"
        />

        <EuiPanel>
          <EditSettingGroup
            settingGroup={SETTING_GROUPS.COMPLIANCE_CONFIG_MODE_SETTINGS}
            config={editConfig}
            handleChange={handleChange}
          />
          {editConfig.compliance && editConfig.compliance.enabled && (
            <>
              <EditSettingGroup
                settingGroup={SETTING_GROUPS.COMPLIANCE_CONFIG_SETTINGS}
                config={editConfig}
                handleChange={handleChange}
              />

              <EuiSpacer />

              <EditSettingGroup
                settingGroup={SETTING_GROUPS.COMPLIANCE_SETTINGS_READ}
                config={editConfig}
                handleChange={handleChange}
                handleInvalid={handleInvalid}
              />

              <EuiSpacer />

              <EditSettingGroup
                settingGroup={SETTING_GROUPS.COMPLIANCE_SETTINGS_WRITE}
                config={editConfig}
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
              <EuiTitle size="l">
                <h1>General settings</h1>
              </EuiTitle>
            </EuiPageHeader>
          }
          resourceType={ResourceType.auditLogging}
          pageTitle="General settings"
        />

        <EuiPanel>
          <EditSettingGroup
            settingGroup={SETTING_GROUPS.LAYER_SETTINGS}
            config={editConfig}
            handleChange={handleChange}
          />
          <EuiSpacer size="xl" />
          <EditSettingGroup
            settingGroup={SETTING_GROUPS.ATTRIBUTE_SETTINGS}
            config={editConfig}
            handleChange={handleChange}
          />
          <EuiSpacer size="xl" />
          <EditSettingGroup
            settingGroup={SETTING_GROUPS.IGNORE_SETTINGS}
            config={editConfig}
            handleChange={handleChange}
          />
        </EuiPanel>
        <EuiSpacer />
        {renderSaveAndCancel()}

        <EuiGlobalToastList toasts={toasts} toastLifeTimeMs={10000} dismissToast={removeToast} />
      </>
    );
  };

  let content;

  if (props.setting === 'general') {
    content = renderGeneralSettings();
  } else {
    content = renderComplianceSetting();
  }

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
