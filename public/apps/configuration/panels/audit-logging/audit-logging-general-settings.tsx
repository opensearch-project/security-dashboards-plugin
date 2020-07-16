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

import React, { useCallback, useEffect, useState } from 'react';
import {
  EuiButton,
  EuiCallOut,
  EuiFlexGroup,
  EuiFlexItem,
  EuiGlobalToastList,
  EuiPageHeader,
  EuiPanel,
  EuiSpacer,
  EuiTitle,
} from '@elastic/eui';
import { cloneDeep, set } from 'lodash';
import { Toast } from '@elastic/eui/src/components/toast/global_toast_list';
import { AppDependencies } from '../../../types';
import { EditSettingGroup } from './edit-setting-group';
import { SETTING_GROUPS, SettingContent } from './constants';
import { API_ENDPOINT_AUDITLOGGING } from '../../constants';
import { updateAuditLogging } from '../../utils/audit-logging-view-utils';
import { AuditLoggingSettings } from './types';
import { buildHashUrl } from '../../utils/url-builder';
import { ResourceType } from '../../types';

export function AuditLoggingEditGeneralSetting(props: AppDependencies) {
  const [editConfig, setEditConfig] = useState<AuditLoggingSettings>({});

  const [toasts, setToasts] = useState<Toast[]>([]);
  const addToast = useCallback((toastToAdd: Toast) => {
    setToasts((state) => state.concat(toastToAdd));
  }, []);
  const removeToast = (toastToDelete: Toast) => {
    setToasts(toasts.filter((toast) => toast.id !== toastToDelete.id));
  };

  const handleChange = (setting: SettingContent, val: boolean | string[]) => {
    setEditConfig((previousEditedConfig) => {
      return set(cloneDeep(editConfig), setting.path, val);
    });
  };

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const rawConfig = await props.coreStart.http.get(API_ENDPOINT_AUDITLOGGING);
        const fetchedConfig = rawConfig.data.config;
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
              onClick={() => {
                window.location.href = buildHashUrl(ResourceType.auditLogging);
              }}
            >
              Cancel
            </EuiButton>
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiButton
              fill
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

  const saveConfig = async (configToUpdate: object) => {
    try {
      await updateAuditLogging(props.coreStart.http, configToUpdate);

      const successToast: Toast = {
        id: 'update-result',
        color: 'success',
        iconType: 'check',
        title: 'Audit configuration was successfully updated.',
      };

      addToast(successToast);
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

  return (
    <>
      <EuiPageHeader>
        <EuiTitle size="l">
          <h1>General settings</h1>
        </EuiTitle>
      </EuiPageHeader>

      <EuiPanel>
        <EuiCallOut title="Warning" color="warning">
          <p>
            Enabling REST and Transport layers (config:enable_rest, config:enable_transport) may
            result in a massive number of logs if AUTHENTICATED and GRANTED_PRIVILEGES are not
            disabled. We suggest you ignore common requests if doing so.
          </p>

          <p>
            Enabling Bulk requests (config:resolve_bulk_requests) will generate one log per request,
            and may also result in very large log files.
          </p>
        </EuiCallOut>

        <EuiSpacer />

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
}
