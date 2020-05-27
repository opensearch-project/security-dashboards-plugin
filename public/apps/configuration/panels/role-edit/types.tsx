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

import { EuiComboBoxOptionOption } from '@elastic/eui';

export type ComboBoxOptions = EuiComboBoxOptionOption[];
export type FieldLevelSecurityMethod = 'exclude' | 'include';
export interface RoleIndexPermissionStateClass {
  indexPatterns: ComboBoxOptions;
  docLevelSecurity: string;
  fieldLevelSecurityMethod: FieldLevelSecurityMethod;
  fieldLevelSecurityFields: ComboBoxOptions;
  maskedFields: ComboBoxOptions;
  allowedActions: ComboBoxOptions;
}

export enum TenantPermissionType {
  None = '',
  Read = 'r',
  Write = 'w',
  Full = 'rw',
}

export interface RoleTenantPermissionStateClass {
  tenantPatterns: ComboBoxOptions;
  permissionType: TenantPermissionType;
}
