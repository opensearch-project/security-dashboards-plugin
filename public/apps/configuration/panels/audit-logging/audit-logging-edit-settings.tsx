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

import React from 'react';
import {
  EuiButton,
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
import { ResourceType } from '../../types';
import { getAuditLogging, updateAuditLogging } from '../../utils/audit-logging-utils';
import { useToastState } from '../../utils/toast-utils';
import { setCrossPageToast } from '../../utils/storage-utils';

interface AuditLoggingEditSettingProps extends AppDependencies {
  setting: 'general' | 'compliance';
}

export function AuditLoggingEditSettings(props: AuditLoggingEditSettingProps) {
  const [editConfig, setEditConfig] = React.useState<AuditLoggingSettings>({});
  const [toasts, addToast, removeToast] = useToastState();
  const [invalidSettings, setInvalidSettings] = React.useState<string[]>([]);

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
        const fetchedConfig = await getAuditLogging(props.coreStart.http);
        setEditConfig(fetchedConfig);
      } catch (e) {
        console.log(e);
      }
    };

    fetchConfig();
  }, [props.coreStart.http]);

  const renderSaveAndCancel = () => {
    return (
      <>
        <EuiFlexGroup justifyContent="flexEnd">
          <EuiFlexItem grow={false}>
            <EuiButton
              data-test-subj="cancel"
              onClick={() => {
                window.location.href = buildHashUrl(ResourceType.auditLogging);
              }}
            >
              Cancel
            </EuiButton>
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiButton
              data-test-subj="save"
              fill
              isDisabled={invalidSettings.length !== 0}
              onClick={() => {
                saveConfig(editConfig);
              }}
            >
              Save
            </EuiButton>
          </EuiFlexItem>
        </EuiFlexGroup>
      </>
    );
  };

  const saveConfig = async (configToUpdate: AuditLoggingSettings) => {
    try {
      await updateAuditLogging(props.coreStart.http, configToUpdate);

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
        addSuccessToast('General settings saved');
      } else {
        addSuccessToast('Compliance settings saved');
      }

      window.location.href = buildHashUrl(ResourceType.auditLogging);
    } catch (e) {
      const failureToast: Toast = {
        id: 'update-result',
        color: 'danger',
        iconType: 'alert',
        title: 'Failed to update audit configuration due to ' + e?.message,
      };

      addToast(failureToast);
    } finally {
      window.scrollTo({ top: 0 });
    }
  };

  const renderComplianceSetting = () => {
    return (
      <>
        <EuiPageHeader>
          <EuiTitle size="l">
            <h1>Compliance settings</h1>
          </EuiTitle>
        </EuiPageHeader>

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
        <EuiPageHeader>
          <EuiTitle size="l">
            <h1>General settings</h1>
          </EuiTitle>
        </EuiPageHeader>

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

  return <div className="panel-restrict-width">{content}</div>;
}
