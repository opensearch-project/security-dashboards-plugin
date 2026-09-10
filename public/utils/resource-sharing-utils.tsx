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

import { CoreStart } from '../../../../src/core/public';
import {
  createRequestContextWithDataSourceId,
  createLocalClusterRequestContext,
} from '../apps/configuration/utils/request-utils';
import { API_ENDPOINT_RESOURCE_SHARING_ENABLED } from '../../common';

export const buildResourceApi = (http: CoreStart['http'], dataSourceId?: string) => {
  const context = dataSourceId
    ? createRequestContextWithDataSourceId(dataSourceId)
    : createLocalClusterRequestContext();

  return {
    listTypes: () => context.httpGetWithQuery(http, '/api/resource/types'),
    listSharingRecords: (type: string) =>
      context.httpGetWithQuery(http, '/api/resource/list', { resourceType: type }),
    getSharingRecord: (id: string, type: string) =>
      context.httpGetWithQuery(http, '/api/resource/view', { resourceId: id, resourceType: type }),
    share: (payload: any) => context.httpPut({ http, url: '/api/resource/share', body: payload }),
    update: (payload: any) =>
      context.httpPost({ http, url: '/api/resource/update_sharing', body: payload }),
  };
};

/**
 * Whether the resource-sharing feature flag is enabled on the selected data
 * source. Reads only the boolean from the minimal endpoint. Fails closed.
 */
export async function isResourceSharingEnabled(
  http: CoreStart['http'],
  dataSourceId?: string
): Promise<boolean> {
  const context = dataSourceId
    ? createRequestContextWithDataSourceId(dataSourceId)
    : createLocalClusterRequestContext();
  const response: any = await context.httpGetWithQuery(http, API_ENDPOINT_RESOURCE_SHARING_ENABLED);
  return !!response?.enabled;
}

/**
 * Whether resource sharing is available for `resourceType` on the selected data
 * source. Gated on the feature flag and per-type registration, evaluated per
 * data source (not the local Dashboards capability). Fails closed on error.
 */
export async function isResourceSharingAvailable(
  http: CoreStart['http'],
  resourceType: string,
  dataSourceId?: string
): Promise<boolean> {
  try {
    // Global gate: feature flag must be enabled on the selected data source.
    if (!(await isResourceSharingEnabled(http, dataSourceId))) {
      return false;
    }

    // Per-type gate: type must be registered/protected on that data source.
    const response: any = await buildResourceApi(http, dataSourceId).listTypes();
    // listTypes() may return a bare array or a { types: [...] } wrapper.
    const types: Array<{ type: string }> = Array.isArray(response)
      ? response
      : (response?.types ?? []);
    return types.some((registeredType) => registeredType?.type === resourceType);
  } catch (e) {
    return false;
  }
}
