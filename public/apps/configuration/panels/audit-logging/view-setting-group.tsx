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
import { get } from 'lodash';
import { EuiFlexGrid, EuiSpacer, EuiText } from '@elastic/eui';
import { SettingContent, SettingGroup } from './constants';
import { AuditLoggingSettings } from './types';
import {
  displayArray,
  displayBoolean,
  displayObject,
  renderTextFlexItem,
} from '../../utils/display-utils';

export function ViewSettingGroup(props: {
  settingGroup: SettingGroup;
  config: AuditLoggingSettings;
}) {
  const renderField = (config: AuditLoggingSettings, setting: SettingContent) => {
    let val = get(config, setting.path);

    if (setting.type === 'bool') {
      val = val || false;
      // @ts-ignore
      return renderTextFlexItem(setting.title, displayBoolean(val));
    } else if (setting.type === 'array') {
      val = val || [];
      // @ts-ignore
      return renderTextFlexItem(setting.title, displayArray(val));
    } else if (setting.type === 'map') {
      val = val || {};
      // @ts-ignore
      return renderTextFlexItem(setting.title, displayObject(val));
    } else {
      return <></>;
    }
  };

  return (
    <>
      <EuiText>
        <h3>{props.settingGroup.title}</h3>
      </EuiText>

      <EuiSpacer />

      <EuiFlexGrid columns={3}>
        {props.settingGroup.settings.map((setting: SettingContent) => {
          return <Fragment key={setting.title}>{renderField(props.config, setting)}</Fragment>;
        })}
      </EuiFlexGrid>
    </>
  );
}
