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
import { DataObject, ActionGroupItem, ActionGroupUpdate, ObjectsMessage } from '../types';
import { httpDelete, httpGet, httpPost } from './request-utils';
import { getResourceUrl } from './resource-utils';

export interface PermissionListingItem {
  name: string;
  type: 'Action group' | 'Single permission';
  reserved: boolean;
  allowedActions: string[];
  hasClusterPermission: boolean;
  hasIndexPermission: boolean;
}

export async function fetchActionGroups(http: HttpStart): Promise<DataObject<ActionGroupItem>> {
  const actiongroups = await httpGet<ObjectsMessage<ActionGroupItem>>(
    http,
    API_ENDPOINT_ACTIONGROUPS
  );
  return actiongroups.data;
}

export function transformActionGroupsToListingFormat(
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
  return transformActionGroupsToListingFormat(await fetchActionGroups(http));
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
  return mergeAllPermissions(await fetchActionGroups(http));
}

export async function mergeAllPermissions(
  actionGroups: DataObject<ActionGroupItem>
): Promise<PermissionListingItem[]> {
  return transformActionGroupsToListingFormat(actionGroups)
    .concat(getClusterSinglePermissions())
    .concat(getIndexSinglePermissions());
}

export async function updateActionGroup(
  http: HttpStart,
  groupName: string,
  updateObject: ActionGroupUpdate
): Promise<ActionGroupUpdate> {
  return await httpPost(http, getResourceUrl(API_ENDPOINT_ACTIONGROUPS, groupName), updateObject);
}

export async function requestDeleteActionGroups(http: HttpStart, groups: string[]) {
  for (const group of groups) {
    await httpDelete(http, getResourceUrl(API_ENDPOINT_ACTIONGROUPS, group));
  }
}
