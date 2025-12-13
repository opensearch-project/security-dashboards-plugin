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
