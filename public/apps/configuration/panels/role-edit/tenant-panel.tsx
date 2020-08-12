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

import { EuiButton, EuiComboBox, EuiFlexGroup, EuiFlexItem, EuiSuperSelect } from '@elastic/eui';
import React, { Dispatch, Fragment, SetStateAction } from 'react';
import { isEmpty } from 'lodash';
import { RoleTenantPermission, TenantPermissionType } from '../../types';
import {
  appendElementToArray,
  removeElementFromArray,
  updateElementInArrayHandler,
} from '../../utils/array-state-utils';
import {
  appendOptionToComboBoxHandler,
  stringToComboBoxOption,
  comboBoxOptionToString,
} from '../../utils/combo-box-utils';
import { FormRow } from '../../utils/form-row';
import { PanelWithHeader } from '../../utils/panel-with-header';
import { ComboBoxOptions, RoleTenantPermissionStateClass } from './types';
import { TENANT_READ_PERMISSION, TENANT_WRITE_PERMISSION } from '../../constants';
import { getTenantPermissionType } from '../../utils/tenant-utils';

export function buildTenantPermissionState(
  permissions: RoleTenantPermission[]
): RoleTenantPermissionStateClass[] {
  return permissions.map((permission) => {
    const permissionType = getTenantPermissionType(permission.allowed_actions);
    return {
      tenantPatterns: permission.tenant_patterns.map(stringToComboBoxOption),
      permissionType,
    };
  });
}

export function unbuildTenantPermissionState(
  permissions: RoleTenantPermissionStateClass[]
): RoleTenantPermission[] {
  return permissions.map((permission) => {
    const permissionType = permission.permissionType;
    let allowedActions: string[] = [];
    if (permissionType === TenantPermissionType.Full) {
      allowedActions = [TENANT_READ_PERMISSION, TENANT_WRITE_PERMISSION];
    } else if (permissionType === TenantPermissionType.Read) {
      allowedActions = [TENANT_READ_PERMISSION];
    } else if (permissionType === TenantPermissionType.Write) {
      allowedActions = [TENANT_WRITE_PERMISSION];
    }
    return {
      tenant_patterns: permission.tenantPatterns.map(comboBoxOptionToString),
      allowed_actions: allowedActions,
    };
  });
}

function getEmptyTenantPermission(): RoleTenantPermissionStateClass {
  return {
    tenantPatterns: [],
    permissionType: TenantPermissionType.None,
  };
}

function generateTenantPermissionPanels(
  tenantPermissions: RoleTenantPermissionStateClass[],
  permisionOptionsSet: ComboBoxOptions,
  setPermissions: Dispatch<SetStateAction<RoleTenantPermissionStateClass[]>>
) {
  const panels = tenantPermissions.map((tenantPermission, arrayIndex) => {
    const onValueChangeHandler = (attributeToUpdate: string) =>
      updateElementInArrayHandler(setPermissions, [arrayIndex, attributeToUpdate]);

    const onCreateOptionHandler = (attributeToUpdate: string) =>
      appendOptionToComboBoxHandler(setPermissions, [arrayIndex, attributeToUpdate]);

    return (
      <Fragment key={`tenant-permission-${arrayIndex}`}>
        <EuiFlexGroup>
          <EuiFlexItem style={{ maxWidth: '400px' }}>
            <EuiComboBox
              placeholder="Search tenant name"
              selectedOptions={tenantPermission.tenantPatterns}
              onChange={onValueChangeHandler('tenantPatterns')}
              onCreateOption={onCreateOptionHandler('tenantPatterns')}
              options={permisionOptionsSet}
            />
          </EuiFlexItem>
          <EuiFlexItem style={{ maxWidth: '170px' }}>
            <EuiSuperSelect
              valueOfSelected={tenantPermission.permissionType}
              onChange={onValueChangeHandler('permissionType')}
              options={[
                { inputDisplay: TenantPermissionType.Read, value: TenantPermissionType.Read },
                { inputDisplay: TenantPermissionType.Write, value: TenantPermissionType.Write },
                { inputDisplay: TenantPermissionType.Full, value: TenantPermissionType.Full },
              ]}
            />
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiButton
              color="danger"
              onClick={() => removeElementFromArray(setPermissions, [], arrayIndex)}
            >
              Remove
            </EuiButton>
          </EuiFlexItem>
        </EuiFlexGroup>
      </Fragment>
    );
  });
  return <>{panels}</>;
}

export function TenantPanel(props: {
  state: RoleTenantPermissionStateClass[];
  optionUniverse: ComboBoxOptions;
  setState: Dispatch<SetStateAction<RoleTenantPermissionStateClass[]>>;
}) {
  const { state, optionUniverse, setState } = props;
  // Show one empty row if there is no data.
  if (isEmpty(state)) {
    setState([getEmptyTenantPermission()]);
  }
  return (
    <PanelWithHeader
      headerText="Tenants"
      headerSubText="Tenants are useful for safely sharing your work with other Kibana users. You can control which roles have access to a tenant and whether those roles have read or write access."
      helpLink="/"
    >
      <FormRow headerText="Tenant">
        {generateTenantPermissionPanels(state, optionUniverse, setState)}
      </FormRow>

      <EuiButton
        onClick={() => {
          appendElementToArray(setState, [], getEmptyTenantPermission());
        }}
      >
        Add another tenant
      </EuiButton>
    </PanelWithHeader>
  );
}
