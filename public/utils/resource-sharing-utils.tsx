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

export const buildResourceApi = (http: CoreStart['http']) => ({
  listTypes: () => http.get('/api/resource/types'),
  listSharingRecords: (idx: string) =>
    http.get('/api/resource/list', { query: { resourceType: idx } }),
  getSharingRecord: (id: string, idx: string) =>
    http.get('/api/resource/view', { query: { resourceId: id, resourceType: idx } }),
  share: (payload: any) => http.put('/api/resource/share', { body: JSON.stringify(payload) }),
  update: (payload: any) =>
    http.patch('/api/resource/update_sharing', { body: JSON.stringify(payload) }),
});
