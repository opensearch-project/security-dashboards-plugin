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

import { RoleTenantPermission, TenantPermissionType } from '../../../types';
import { TENANT_READ_PERMISSION, TENANT_WRITE_PERMISSION } from '../../../constants';
import { RoleTenantPermissionStateClass } from '../types';
import {
  buildTenantPermissionState,
  unbuildTenantPermissionState,
  TenantPanel,
} from '../tenant-panel';
import { shallow } from 'enzyme';
import React from 'react';
import { EuiComboBox, EuiButton, EuiSuperSelect } from '@elastic/eui';

jest.mock('../../../utils/array-state-utils');
// eslint-disable-next-line
const arrayStateUtils = require('../../../utils/array-state-utils');

describe('Role edit - tenant panel', () => {
  const tenantName1 = 'tenant1';
  it('buildTenantPermissionState', () => {
    const input: RoleTenantPermission[] = [
      {
        tenant_patterns: [tenantName1],
        allowed_actions: [TENANT_READ_PERMISSION],
      },
    ];

    const result = buildTenantPermissionState(input);

    const expected: RoleTenantPermissionStateClass[] = [
      {
        tenantPatterns: [{ label: tenantName1 }],
        permissionType: TenantPermissionType.Read,
      },
    ];
    expect(result).toEqual(expected);
  });

  it('unbuildTenantPermissionState', () => {
    const permissions: RoleTenantPermissionStateClass[] = [
      {
        tenantPatterns: [{ label: tenantName1 }],
        permissionType: TenantPermissionType.ReadWrite,
      },
    ];

    const result = unbuildTenantPermissionState(permissions);

    const expected: RoleTenantPermission[] = [
      {
        tenant_patterns: [tenantName1],
        allowed_actions: [TENANT_WRITE_PERMISSION],
      },
    ];

    expect(result).toEqual(expected);
  });

  describe('TenantPanel', () => {
    const tenantName2 = 'tenant2';
    const optionUniverse = [{ label: tenantName1 }, { label: tenantName2 }];
    const setState = jest.fn();

    it('render an empty row if data is empty', () => {
      shallow(<TenantPanel state={[]} optionUniverse={optionUniverse} setState={setState} />);

      expect(setState).toHaveBeenCalledWith([
        {
          tenantPatterns: [],
          permissionType: TenantPermissionType.ReadWrite,
        },
      ]);
    });

    it('render data', () => {
      const state: RoleTenantPermissionStateClass[] = [
        {
          tenantPatterns: [{ label: tenantName1 }],
          permissionType: TenantPermissionType.ReadWrite,
        },
        {
          tenantPatterns: [{ label: tenantName2 }],
          permissionType: TenantPermissionType.Read,
        },
      ];

      const component = shallow(
        <TenantPanel state={state} optionUniverse={optionUniverse} setState={setState} />
      );

      const comboBoxArray = component.find(EuiComboBox);
      expect(comboBoxArray.length).toEqual(2);
      expect(comboBoxArray.at(0).prop('selectedOptions')).toBe(state[0].tenantPatterns);
      expect(comboBoxArray.at(1).prop('selectedOptions')).toBe(state[1].tenantPatterns);

      const superSelectArray = component.find(EuiSuperSelect);
      expect(superSelectArray.at(0).prop('valueOfSelected')).toBe(state[0].permissionType);
      expect(superSelectArray.at(1).prop('valueOfSelected')).toBe(state[1].permissionType);
    });

    it('add row', () => {
      const component = shallow(
        <TenantPanel state={[]} optionUniverse={optionUniverse} setState={setState} />
      );

      const addRowButton = component.find(EuiButton).last();
      addRowButton.simulate('click');
      expect(arrayStateUtils.appendElementToArray).toHaveBeenCalledTimes(1);
    });

    it('remove row', () => {
      const state: RoleTenantPermissionStateClass[] = [
        {
          tenantPatterns: [{ label: tenantName1 }],
          permissionType: TenantPermissionType.ReadWrite,
        },
      ];

      const component = shallow(
        <TenantPanel state={state} optionUniverse={optionUniverse} setState={setState} />
      );

      const removeRowButton = component.find(EuiButton).first();
      removeRowButton.simulate('click');
      expect(arrayStateUtils.removeElementFromArray).toHaveBeenCalledTimes(1);
    });
  });
});
