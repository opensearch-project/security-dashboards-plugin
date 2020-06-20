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
import { API_ENDPOINT_ACTIONGROUPS } from '../constants';
import { DataObject, ActionGroupItem } from '../types';

export interface ActionGroupListingItem {
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
): ActionGroupListingItem[] {
  return map(rawData, (value: ActionGroupItem, key?: string) => ({
    name: key || '',
    type: 'Action group',
    reserved: value.reserved,
    allowedActions: value.allowed_actions,
    hasClusterPermission: value.type === 'cluster' || value.type === 'all',
    hasIndexPermission: value.type === 'index' || value.type === 'all',
  }));
}

export async function fetchActionGroupListing(http: HttpStart): Promise<ActionGroupListingItem[]> {
  return tranformActionGroupsToListingFormat(await fetchActionGroups(http));
}
