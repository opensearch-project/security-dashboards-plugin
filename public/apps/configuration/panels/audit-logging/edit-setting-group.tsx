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

import React, { Fragment } from 'react';
import {
  EuiComboBox,
  EuiDescribedFormGroup,
  EuiFormRow,
  EuiSpacer,
  EuiSwitch,
  EuiTitle,
} from '@elastic/eui';
import { get } from 'lodash';
import { displayBoolean } from '../../utils/display-utils';
import { comboBoxOptionToString, stringToComboBoxOption } from '../../utils/combo-box-utils';
import { AuditLoggingSettings } from './types';
import { SettingContent, SettingGroup } from './constants';

export function EditSettingGroup(props: {
  settingGroup: SettingGroup;
  config: AuditLoggingSettings;
  handleChange: (setting: SettingContent, val: boolean | string[]) => void;
}) {
  const renderField = (
    config: AuditLoggingSettings,
    setting: SettingContent,
    handleChange: (setting: SettingContent, val: boolean | string[]) => void
  ) => {
    let val = get(config, setting.path);

    if (setting.type === 'bool') {
      val = val || false;

      return (
        <EuiSwitch
          label={displayBoolean(val)}
          checked={val}
          onChange={(e) => {
            handleChange(setting, e.target.checked);
          }}
        />
      );
    } else if (setting.type === 'array' && typeof setting.options !== 'undefined') {
      val = val || [];

      return (
        <EuiComboBox
          placeholder={setting.title}
          options={setting.options.map(stringToComboBoxOption)}
          selectedOptions={val.map(stringToComboBoxOption)}
          onChange={(selectedOptions) => {
            handleChange(setting, selectedOptions.map(comboBoxOptionToString));
          }}
        />
      );
    } else if (setting.type === 'array') {
      val = val || [];

      return (
        <EuiComboBox
          noSuggestions
          placeholder={setting.title}
          selectedOptions={val.map(stringToComboBoxOption)}
          onChange={(selectedOptions) => {
            handleChange(setting, selectedOptions.map(comboBoxOptionToString));
          }}
          onCreateOption={(searchValue) => {
            handleChange(setting, [...val, searchValue]);
          }}
        />
      );
    } else {
      return <></>;
    }
  };

  const settingGroup = props.settingGroup;

  return (
    <>
      {settingGroup.title && (
        <>
          <EuiTitle>
            <h3>{settingGroup.title}</h3>
          </EuiTitle>
          <EuiSpacer />
        </>
      )}
      {settingGroup.settings.map((setting: SettingContent) => {
        return (
          <Fragment key={setting.key}>
            <EuiDescribedFormGroup
              title={<h3>{setting.title}</h3>}
              description={<>{setting.description}</>}
              fullWidth
            >
              <EuiFormRow label={setting.key}>
                {renderField(props.config, setting, props.handleChange)}
              </EuiFormRow>
            </EuiDescribedFormGroup>
          </Fragment>
        );
      })}
    </>
  );
}
