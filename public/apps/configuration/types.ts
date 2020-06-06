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

export interface RouteItem {
  name: string;
  href: string;
}

export interface DataObject<T> {
  [key: string]: T;
}

export interface ObjectsMessage<T> {
  total: number;
  data: DataObject<T>;
}

export interface RoleIndexPermission {
  index_patterns: string[];
  dls: string;
  fls: string[];
  masked_fields: string[];
  allowed_actions: string[];
}

export interface RoleTenantPermission {
  tenant_patterns: string[];
  allowed_actions: string[];
}

export interface RoleUpdate {
  cluster_permissions: string[];
  index_permissions: RoleIndexPermission[];
  tenant_permissions: RoleTenantPermission[];
}

export interface RoleDetail extends RoleUpdate {
  reserved: boolean;
}

export interface Tenant {
  reserved: boolean;
  description: string;
}
export interface InternalUser {
  attributes: {
    [key: string]: string;
  };
}
