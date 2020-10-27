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
import { RoleIndexPermission, ComboBoxOptions, FieldLevelSecurityMethod } from '../../../types';
import { stringToComboBoxOption } from '../../../utils/combo-box-utils';
import {
  buildIndexPermissionState,
  IndexPermissionPanel,
  unbuildIndexPermissionState,
  IndexPatternRow,
  IndexPermissionRow,
  DocLevelSecurityRow,
  FieldLevelSecurityRow,
  AnonymizationRow,
} from '../index-permission-panel';
import { RoleIndexPermissionStateClass } from '../types';
import { EuiComboBox, EuiSuperSelect, EuiButton, EuiTextArea } from '@elastic/eui';

jest.mock('../../../utils/array-state-utils');
// eslint-disable-next-line
const arrayStateUtils = require('../../../utils/array-state-utils');

describe('Role edit - index permission panel', () => {
  const indexPattern1 = 'index1';
  const indexPattern2 = 'index*';
  const allowedAction1 = 'readall';
  const allowedAction2 = 'crud';
  const field1 = 'field1';
  const field2 = 'field2';
  const dls = 'dummy';

  const sampleIndexPatterns = [indexPattern1, indexPattern2];
  const sampleIndexPatternsOptions = sampleIndexPatterns.map(stringToComboBoxOption);
  const sampleActionGroup = [allowedAction1];
  const sampleActionGroupOptions = sampleActionGroup.map(stringToComboBoxOption);
  const sampleOptionUniverse = [allowedAction1, allowedAction2].map(stringToComboBoxOption);
  const setState = jest.fn();

  it('buildIndexPermissionState', () => {
    const input: RoleIndexPermission[] = [
      {
        index_patterns: [indexPattern1, indexPattern2],
        allowed_actions: sampleActionGroup,
        dls,
        fls: ['~' + field1, field2],
        masked_fields: [field1, field2],
      },
    ];

    const result = buildIndexPermissionState(input);

    expect(result).toEqual([
      {
        indexPatterns: sampleIndexPatternsOptions,
        allowedActions: sampleActionGroupOptions,
        docLevelSecurity: dls,
        fieldLevelSecurityMethod: 'exclude',
        fieldLevelSecurityFields: [field1, field2].map(stringToComboBoxOption),
        maskedFields: [field1, field2].map(stringToComboBoxOption),
      },
    ]);
  });

  it('unbuildIndexPermissionState', () => {
    const input: RoleIndexPermissionStateClass[] = [
      {
        indexPatterns: sampleIndexPatternsOptions,
        allowedActions: [allowedAction1].map(stringToComboBoxOption),
        docLevelSecurity: dls,
        fieldLevelSecurityMethod: 'exclude',
        fieldLevelSecurityFields: [field1].map(stringToComboBoxOption),
        maskedFields: [field1, field2].map(stringToComboBoxOption),
      },
      {
        indexPatterns: sampleIndexPatternsOptions,
        allowedActions: [allowedAction1].map(stringToComboBoxOption),
        docLevelSecurity: dls,
        fieldLevelSecurityMethod: 'include',
        fieldLevelSecurityFields: [field2].map(stringToComboBoxOption),
        maskedFields: [field1, field2].map(stringToComboBoxOption),
      },
    ];

    const result = unbuildIndexPermissionState(input);

    expect(result).toEqual([
      {
        index_patterns: sampleIndexPatterns,
        allowed_actions: sampleActionGroup,
        dls,
        fls: ['~' + field1],
        masked_fields: [field1, field2],
      },
      {
        index_patterns: sampleIndexPatterns,
        allowed_actions: sampleActionGroup,
        dls,
        fls: [field2],
        masked_fields: [field1, field2],
      },
    ]);
  });

  it('IndexPatternRow', () => {
    const value: ComboBoxOptions = sampleIndexPatternsOptions;
    const onChangeHandler: (s: ComboBoxOptions) => void = jest.fn();
    const onCreateHandler: (s: string) => void = jest.fn();

    const component = shallow(<IndexPatternRow {...{ value, onChangeHandler, onCreateHandler }} />);

    expect(component.find(EuiComboBox).first().prop('selectedOptions')).toBe(value);
  });

  it('IndexPermissionRow', () => {
    const value: ComboBoxOptions = sampleActionGroupOptions;
    const permisionOptionsSet = sampleOptionUniverse;
    const onChangeHandler: (s: ComboBoxOptions) => void = jest.fn();

    const component = shallow(
      <IndexPermissionRow {...{ value, onChangeHandler, permisionOptionsSet }} />
    );

    expect(component.find(EuiComboBox).first().prop('selectedOptions')).toBe(value);
  });

  it('DocLevelSecurityRow', () => {
    const value: string = 'dls';
    const onChangeHandler: (e: React.ChangeEvent<HTMLTextAreaElement>) => void = jest.fn();

    const component = shallow(<DocLevelSecurityRow {...{ value, onChangeHandler }} />);

    expect(component.find(EuiTextArea).first().prop('value')).toBe(value);
  });

  it('FieldLevelSecurityRow', () => {
    const method: FieldLevelSecurityMethod = 'exclude';
    const fields: ComboBoxOptions = [field1, field2].map(stringToComboBoxOption);
    const onMethodChangeHandler: (s: string) => void = jest.fn();
    const onFieldChangeHandler: (s: ComboBoxOptions) => void = jest.fn();
    const onFieldCreateHandler: (s: string) => void = jest.fn();

    const component = shallow(
      <FieldLevelSecurityRow
        {...{ method, fields, onMethodChangeHandler, onFieldChangeHandler, onFieldCreateHandler }}
      />
    );

    expect(component.find(EuiSuperSelect).first().prop('valueOfSelected')).toBe(method);
    expect(component.find(EuiComboBox).first().prop('selectedOptions')).toBe(fields);
  });

  it('AnonymizationRow', () => {
    const value: ComboBoxOptions = [field1, field2].map(stringToComboBoxOption);
    const onChangeHandler: (s: ComboBoxOptions) => void = jest.fn();
    const onCreateHandler: (s: string) => void = jest.fn();

    const component = shallow(
      <AnonymizationRow {...{ value, onChangeHandler, onCreateHandler }} />
    );

    expect(component.find(EuiComboBox).first().prop('selectedOptions')).toBe(value);
  });

  describe('IndexPermissionPanel', () => {
    it('should add an empty row if empty data', () => {
      const state: RoleIndexPermissionStateClass[] = [];
      const optionUniverse: ComboBoxOptions = [];

      shallow(<IndexPermissionPanel {...{ state, optionUniverse, setState }} />);

      expect(setState).toHaveBeenCalledTimes(1);
    });

    it('render data', () => {
      const state: RoleIndexPermissionStateClass[] = [
        {
          indexPatterns: sampleIndexPatternsOptions,
          allowedActions: sampleActionGroupOptions,
          docLevelSecurity: dls,
          fieldLevelSecurityMethod: 'exclude',
          fieldLevelSecurityFields: [field1, field2].map(stringToComboBoxOption),
          maskedFields: [field1, field2].map(stringToComboBoxOption),
        },
        {
          indexPatterns: sampleIndexPatternsOptions,
          allowedActions: sampleActionGroupOptions,
          docLevelSecurity: dls,
          fieldLevelSecurityMethod: 'include',
          fieldLevelSecurityFields: [field2, field1].map(stringToComboBoxOption),
          maskedFields: [field2, field1].map(stringToComboBoxOption),
        },
      ];
      const optionUniverse = sampleOptionUniverse;

      const result = shallow(<IndexPermissionPanel {...{ state, optionUniverse, setState }} />);

      expect(result.find(IndexPatternRow).length).toBe(2);
      expect(result.find(IndexPermissionRow).length).toBe(2);
      expect(result.find(DocLevelSecurityRow).length).toBe(2);
      expect(result.find(FieldLevelSecurityRow).length).toBe(2);
      expect(result.find(AnonymizationRow).length).toBe(2);
    });

    it('add row', () => {
      const state: RoleIndexPermissionStateClass[] = [
        {
          indexPatterns: sampleIndexPatternsOptions,
          allowedActions: sampleActionGroupOptions,
          docLevelSecurity: dls,
          fieldLevelSecurityMethod: 'exclude',
          fieldLevelSecurityFields: [field1, field2].map(stringToComboBoxOption),
          maskedFields: [field1, field2].map(stringToComboBoxOption),
        },
      ];
      const optionUniverse = [allowedAction1, allowedAction2].map(stringToComboBoxOption);

      const component = shallow(<IndexPermissionPanel {...{ state, optionUniverse, setState }} />);
      component.find(EuiButton).last().simulate('click');

      expect(arrayStateUtils.appendElementToArray).toHaveBeenCalledTimes(1);
    });

    // TODO: Add unit test for remove row. Need to investigate how to simulate a click on a Accordion's extraAction
  });
});
