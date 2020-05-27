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
import { RoleTenantPermission } from '../../types';
import {
  appendElementToArray,
  removeElementFromArray,
  updateElementInArrayHandler,
} from '../../utils/array-state-utils';
import { appendOptionToComboBoxHandler, stringToComboBoxOption } from '../../utils/combo-box-utils';
import { FormRow } from '../../utils/form-row';
import { PanelWithHeader } from '../../utils/panel-with-header';
import { ComboBoxOptions, RoleTenantPermissionStateClass, TenantPermissionType } from './types';

const TENANT_READ_PERMISSION = 'kibana_all_read';
const TENANT_WRITE_PERMISSION = 'kibana_all_write';

export function buildTenantPermissionState(
  permissions: RoleTenantPermission[]
): RoleTenantPermissionStateClass[] {
  return permissions.map(permission => {
    const readable = permission.allowed_actions.includes(TENANT_READ_PERMISSION);
    const writable = permission.allowed_actions.includes(TENANT_WRITE_PERMISSION);
    let permissionType = TenantPermissionType.None;
    if (readable && writable) {
      permissionType = TenantPermissionType.Full;
    } else if (readable) {
      permissionType = TenantPermissionType.Read;
    } else if (writable) {
      permissionType = TenantPermissionType.Write;
    }
    return {
      tenantPatterns: permission.tenant_patterns.map(stringToComboBoxOption),
      permissionType,
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
  permissions: RoleTenantPermissionStateClass[],
  permisionOptionsSet: ComboBoxOptions,
  setPermissions: Dispatch<SetStateAction<RoleTenantPermissionStateClass[]>>
) {
  const panels = permissions.map((permission, arrayIndex) => {
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
              selectedOptions={permission.tenantPatterns}
              onChange={onValueChangeHandler('tenantPatterns')}
              onCreateOption={onCreateOptionHandler('tenantPatterns')}
              options={permisionOptionsSet}
            />
          </EuiFlexItem>
          <EuiFlexItem style={{ maxWidth: '170px' }}>
            <EuiSuperSelect
              valueOfSelected={permission.permissionType}
              onChange={onValueChangeHandler('permissionType')}
              options={[
                { inputDisplay: 'Read only', value: TenantPermissionType.Read },
                { inputDisplay: 'Write only', value: TenantPermissionType.Write },
                { inputDisplay: 'Read and Write', value: TenantPermissionType.Full },
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
