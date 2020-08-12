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

import { map } from 'lodash';
import { RoleIndexPermission, RoleIndexPermissionView, FieldLevelSecurityMethod } from '../types';

/**
 * Identify the method is whether exclude or include.
 * @param fieldLevelSecurityRawFields fields fetched from backend
 * ["~field1", "~field2"] => exclude
 * ["field1", "field2"] => include
 */
export function getFieldLevelSecurityMethod(
  fieldLevelSecurityRawFields: string[]
): FieldLevelSecurityMethod {
  // Leading ~ indicates exclude.
  return fieldLevelSecurityRawFields.some((s: string) => s.startsWith('~')) ? 'exclude' : 'include';
}

export function transformRoleIndexPermissions(
  roleIndexPermission: RoleIndexPermission[]
): RoleIndexPermissionView[] {
  return map(roleIndexPermission, (indexPermission: RoleIndexPermission, arrayIndex: number) => ({
    id: arrayIndex,
    ...indexPermission,
  }));
}
