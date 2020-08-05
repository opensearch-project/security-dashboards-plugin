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

import { HttpStart } from 'kibana/public';
import { map } from 'lodash';
import { API_ENDPOINT_ACTIONGROUPS, CLUSTER_PERMISSIONS, INDEX_PERMISSIONS } from '../constants';
import { DataObject, ActionGroupItem, ActionGroupUpdate } from '../types';

export interface PermissionListingItem {
  name: string;
  type: 'Action group' | 'Single permission';
  reserved: boolean;
  allowedActions: string[];
  hasClusterPermission: boolean;
  hasIndexPermission: boolean;
}

export async function fetchActionGroups(http: HttpStart): Promise<DataObject<ActionGroupItem>> {
  const actiongroups = await http.get(API_ENDPOINT_ACTIONGROUPS);
  return actiongroups.data;
}

function tranformActionGroupsToListingFormat(
  rawData: DataObject<ActionGroupItem>
): PermissionListingItem[] {
  return map(rawData, (value: ActionGroupItem, key?: string) => ({
    name: key || '',
    type: 'Action group',
    reserved: value.reserved,
    allowedActions: value.allowed_actions,
    hasClusterPermission: value.type === 'cluster' || value.type === 'all',
    hasIndexPermission: value.type === 'index' || value.type === 'all',
  }));
}

export async function fetchActionGroupListing(http: HttpStart): Promise<PermissionListingItem[]> {
  return tranformActionGroupsToListingFormat(await fetchActionGroups(http));
}

function getClusterSinglePermissions(): PermissionListingItem[] {
  return CLUSTER_PERMISSIONS.map((permission) => ({
    name: permission,
    type: 'Single permission',
    reserved: true,
    allowedActions: [],
    hasClusterPermission: true,
    hasIndexPermission: false,
  }));
}

function getIndexSinglePermissions(): PermissionListingItem[] {
  return INDEX_PERMISSIONS.map((permission) => ({
    name: permission,
    type: 'Single permission',
    reserved: true,
    allowedActions: [],
    hasClusterPermission: false,
    hasIndexPermission: true,
  }));
}

export async function getAllPermissionsListing(http: HttpStart): Promise<PermissionListingItem[]> {
  return getAllPermissionsListingLocal(await fetchActionGroups(http));
}

export async function getAllPermissionsListingLocal(
  actionGroups: DataObject<ActionGroupItem>
): Promise<PermissionListingItem[]> {
  return tranformActionGroupsToListingFormat(actionGroups)
    .concat(getClusterSinglePermissions())
    .concat(getIndexSinglePermissions());
}

export async function updateActionGroup(
  http: HttpStart,
  groupName: string,
  updateObject: ActionGroupUpdate
): Promise<ActionGroupUpdate> {
  return await http.post(`${API_ENDPOINT_ACTIONGROUPS}/${groupName}`, {
    body: JSON.stringify(updateObject),
  });
}

export async function requestDeleteActionGroups(http: HttpStart, groups: string[]) {
  for (const group of groups) {
    await http.delete(`${API_ENDPOINT_ACTIONGROUPS}/${group}`);
  }
}
