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
  EuiCodeBlock,
  EuiComboBox,
  EuiDescribedFormGroup,
  EuiFormRow,
  EuiSpacer,
  EuiSwitch,
  EuiTitle,
} from '@elastic/eui';
import { get, isEmpty } from 'lodash';
import { displayBoolean, displayObject } from '../../utils/display-utils';
import { comboBoxOptionToString, stringToComboBoxOption } from '../../utils/combo-box-utils';
import { AuditLoggingSettings } from './types';
import { SettingContent, SettingGroup, SettingMapItem } from './constants';
import { JsonCodeEditor } from './code-editor';
import './_index.scss';

const renderCodeBlock = (setting: SettingContent) => {
  return (
    <>
      <EuiCodeBlock paddingSize="none" isCopyable>
        {setting.code}
      </EuiCodeBlock>
    </>
  );
};

const displayLabel = (val: string) => {
  return val.replace(/\./g, ':');
};

export function EditSettingGroup(props: {
  settingGroup: SettingGroup;
  config: AuditLoggingSettings;
  handleChange: (path: string, val: boolean | string[]) => void;
  handleInvalid?: (path: string, error: boolean) => void;
}) {
  const renderField = (
    config: AuditLoggingSettings,
    setting: SettingContent,
    handleChange: (path: string, val: boolean | string[] | SettingMapItem) => void,
    handleInvalid?: (path: string, error: boolean) => void
  ) => {
    let val = get(config, setting.path);

    if (setting.type === 'bool') {
      val = val || false;

      return (
        <EuiSwitch
          // @ts-ignore
          label={displayBoolean(val)}
          // @ts-ignore
          checked={val}
          onChange={(e) => {
            handleChange(setting.path, e.target.checked);
          }}
        />
      );
    } else if (setting.type === 'array' && typeof setting.options !== 'undefined') {
      val = val || [];

      return (
        <EuiComboBox
          placeholder={setting.title}
          options={setting.options.map(stringToComboBoxOption)}
          // @ts-ignore
          selectedOptions={val.map(stringToComboBoxOption)}
          onChange={(selectedOptions) => {
            handleChange(setting.path, selectedOptions.map(comboBoxOptionToString));
          }}
        />
      );
    } else if (setting.type === 'array') {
      val = val || [];

      return (
        <EuiComboBox
          noSuggestions
          placeholder={setting.title}
          // @ts-ignore
          selectedOptions={val.map(stringToComboBoxOption)}
          onChange={(selectedOptions) => {
            // @ts-ignore
            handleChange(setting.path, selectedOptions.map(comboBoxOptionToString));
          }}
          onCreateOption={(searchValue) => {
            // @ts-ignore
            handleChange(setting.path, [...val, searchValue]);
          }}
        />
      );
    } else if (setting.type === 'map') {
      const handleCodeChange = (newVal: string) => {
        const updated: SettingMapItem = JSON.parse(newVal);
        handleChange(setting.path, updated);
      };

      const handleCodeInvalid = (error: boolean) => {
        // @ts-ignore
        handleInvalid(setting.path, error);
      };

      const codeMap = get(config, setting.path);
      let codeString;

      if (isEmpty(codeMap)) {
        codeString = '{}';
      } else {
        // @ts-ignore
        codeString = displayObject(codeMap);
      }

      return (
        <JsonCodeEditor
          // @ts-ignore
          initialValue={codeString}
          // @ts-ignore
          errorMessage={setting.error}
          handleCodeChange={handleCodeChange}
          handleCodeInvalid={handleCodeInvalid}
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
          <Fragment key={setting.path}>
            <EuiDescribedFormGroup
              title={<h3>{setting.title}</h3>}
              description={
                <div style={{ maxWidth: '450px' }}>
                  {setting.description}
                  {setting.code && renderCodeBlock(setting)}
                </div>
              }
              fullWidth
            >
              {/* @ts-ignore*/}
              <EuiFormRow label={displayLabel(setting.path)}>
                {/* @ts-ignore*/}
                {renderField(props.config, setting, props.handleChange, props.handleInvalid)}
              </EuiFormRow>
            </EuiDescribedFormGroup>
          </Fragment>
        );
      })}
    </>
  );
}
