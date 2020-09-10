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

import { shallow } from 'enzyme';
import React from 'react';
import { EditSettingGroup } from '../edit-setting-group';
import { CONFIG, SettingContent, SettingGroup } from '../constants';
import { AuditLoggingSettings, ComplianceSettings, GeneralSettings } from '../types';
import { EuiComboBox, EuiSwitch } from '@elastic/eui';
import { stringToComboBoxOption } from '../../../utils/combo-box-utils';
import { JsonCodeEditor } from '../code-editor';
import { displayObject } from '../../../utils/display-utils';

describe('Edit setting', () => {
  it('Edit settings for various types', () => {
    const booleanSettingContent = CONFIG.AUDIT.REST_LAYER;
    const arrayWithOptionsSettingContent = CONFIG.AUDIT.REST_DISABLED_CATEGORIES;
    const arrayWithoutOptionsSettingContent = CONFIG.COMPLIANCE.READ_IGNORED_USERS;
    const mapSettingContent = CONFIG.COMPLIANCE.READ_WATCHED_FIELDS;

    const dummySettingContent: SettingContent = {
      title: 'dummy title',
      path: 'dummy path',
      description: 'dummy description',
      type: 'dummy type',
    };

    const settings = [
      booleanSettingContent,
      arrayWithOptionsSettingContent,
      arrayWithoutOptionsSettingContent,
      mapSettingContent,
      dummySettingContent,
    ];

    const title = 'test_title';
    const settingGroup: SettingGroup = {
      title,
      settings,
    };

    const audit: GeneralSettings = {
      enable_rest: true,
      disabled_rest_categories: ['FAILED_LOGIN'],
    };

    const compliance: ComplianceSettings = {
      read_ignore_users: ['a', 'b'],
      read_watched_fields: {
        a: 'a1',
        b: 'b1',
      },
    };

    const config: AuditLoggingSettings = {
      enabled: true,
      audit,
      compliance,
    };

    const mockHandleChange = jest.fn();
    const mockHandleInvalid = jest.fn();

    const component = shallow(
      <EditSettingGroup
        settingGroup={settingGroup}
        config={config}
        handleChange={mockHandleChange}
        handleInvalid={mockHandleInvalid}
      />
    );

    expect(component.find(EuiSwitch).prop('checked')).toBeTruthy();

    expect(component.find(EuiComboBox).length).toEqual(2);

    expect(component.find(EuiComboBox).at(0).prop('selectedOptions')).toEqual(
      audit.disabled_rest_categories?.map(stringToComboBoxOption)
    );

    expect(component.find(EuiComboBox).at(1).prop('selectedOptions')).toEqual(
      compliance.read_ignore_users?.map(stringToComboBoxOption)
    );

    expect(component.find(JsonCodeEditor).prop('initialValue')).toEqual(
      displayObject(compliance.read_watched_fields)
    );
  });
});
