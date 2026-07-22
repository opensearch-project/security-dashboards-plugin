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

export interface CreatedBy {
  user: string;
  tenant?: string;
}

export interface ShareRecipients {
  users?: string[];
  roles?: string[];
  backend_roles?: string[];
}

/** Map of access-level (e.g. READ_ONLY) to recipients */
export type ShareWith = Record<string, ShareRecipients>;

export interface ResourceRow {
  resource_id: string;
  resource_type: string;
  created_by: CreatedBy;
  share_with?: ShareWith; // may be empty/undefined
  can_share?: boolean; // whether the current user can share this resource
}

export interface TypeEntry {
  type: string; // type of resource, e.g. `sample-resource`
  access_levels: string[]; // known access-levels for this type
}

/** API contract consumed by resource-sharing UI components */
export interface ResourceSharingApi {
  listTypes: () => Promise<{ types: TypeEntry[] } | TypeEntry[]>;
  listSharingRecords: (type: string) => Promise<ResourceRow[] | { resources: ResourceRow[] } | any>;
  getSharingRecord: (
    id: string,
    type: string
  ) => Promise<ResourceRow | { resource: ResourceRow } | any>;
  share: (payload: {
    resource_id: string;
    resource_type: string;
    share_with: ShareWith;
  }) => Promise<any>;
  update: (payload: {
    resource_id: string;
    resource_type: string;
    add?: ShareWith;
    revoke?: ShareWith;
  }) => Promise<any>;
}
