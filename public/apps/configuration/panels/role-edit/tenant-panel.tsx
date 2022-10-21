/*
 *   Copyright OpenSearch Contributors
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
import { RoleTenantPermission, TenantPermissionType, ComboBoxOptions } from '../../types';
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
import { RoleTenantPermissionStateClass } from './types';
import { DocLinks, TENANT_READ_PERMISSION, TENANT_WRITE_PERMISSION } from '../../constants';
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

const TENANT_PERMISSION_TYPE_DICT: Record<string, string[]> = {
  [TenantPermissionType.ReadWrite]: [TENANT_WRITE_PERMISSION],
  [TenantPermissionType.Read]: [TENANT_READ_PERMISSION],
  [TenantPermissionType.None]: [],
};

export function unbuildTenantPermissionState(
  permissions: RoleTenantPermissionStateClass[]
): RoleTenantPermission[] {
  return permissions.map((permission) => {
    return {
      tenant_patterns: permission.tenantPatterns.map(comboBoxOptionToString),
      allowed_actions: TENANT_PERMISSION_TYPE_DICT[permission.permissionType],
    };
  });
}

function getEmptyTenantPermission(): RoleTenantPermissionStateClass {
  return {
    tenantPatterns: [],
    permissionType: TenantPermissionType.ReadWrite,
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
              placeholder="Search tenant name or add a tenant pattern"
              selectedOptions={tenantPermission.tenantPatterns}
              onChange={onValueChangeHandler('tenantPatterns')}
              onCreateOption={onCreateOptionHandler('tenantPatterns')}
              options={permisionOptionsSet}
              id="roles-tenant-permission-box"
            />
          </EuiFlexItem>
          <EuiFlexItem style={{ maxWidth: '170px' }}>
            <EuiSuperSelect
              valueOfSelected={tenantPermission.permissionType}
              onChange={onValueChangeHandler('permissionType')}
              options={[
                { inputDisplay: TenantPermissionType.Read, value: TenantPermissionType.Read },
                {
                  inputDisplay: TenantPermissionType.ReadWrite,
                  value: TenantPermissionType.ReadWrite,
                },
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
      headerText="Tenant permissions"
      headerSubText="Tenants are useful for safely sharing your work with other OpenSearch Dashboards users. You can control which roles have access to a tenant and whether those roles have read and/or write access."
      helpLink={DocLinks.TenantPermissionsDoc}
    >
      <FormRow headerText="Tenant">
        {generateTenantPermissionPanels(state, optionUniverse, setState)}
      </FormRow>

      <EuiButton
        onClick={() => {
          appendElementToArray(setState, [], getEmptyTenantPermission());
        }}
      >
        Add another tenant permission
      </EuiButton>
    </PanelWithHeader>
  );
}
