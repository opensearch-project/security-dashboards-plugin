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
import { ViewSettingGroup } from '../view-setting-group';
import { CONFIG, SettingContent, SettingGroup } from '../constants';
import { AuditLoggingSettings, ComplianceSettings, GeneralSettings } from '../types';
import React from 'react';
import { EuiText } from '@elastic/eui';
import { displayArray, displayObject } from '../../../utils/display-utils';

describe('View setting group', () => {
  it('View settings of various types', () => {
    const booleanSettingContent = CONFIG.AUDIT.REST_LAYER;
    const arraySettingContent = CONFIG.AUDIT.REST_DISABLED_CATEGORIES;
    const mapSettingContent = CONFIG.COMPLIANCE.READ_WATCHED_FIELDS;

    const dummySettingContent: SettingContent = {
      title: 'dummy title',
      path: 'dummy path',
      description: 'dummy description',
      type: 'dummy type',
    };

    // pick setting contents with all the current supported types and one dummy type.
    const settings = [
      booleanSettingContent,
      arraySettingContent,
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
      disabled_rest_categories: ['c1', 'c2', 'c3'],
    };

    const compliance: ComplianceSettings = {
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

    const component = shallow(<ViewSettingGroup settingGroup={settingGroup} config={config} />);

    expect(component.find(EuiText).length).toBe(4);
    expect(component.find(EuiText).at(0).find('h3').text()).toEqual(title);
    expect(component.find(EuiText).at(1).find('div').text()).toEqual('Enabled');
    expect(component.find(EuiText).at(2).find('div').text()).toEqual(
      displayArray(audit.disabled_rest_categories)
    );
    expect(component.find(EuiText).at(3).find('div').text()).toEqual(
      displayObject(compliance.read_watched_fields)
    );
  });
});
