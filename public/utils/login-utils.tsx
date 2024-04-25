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

import { HttpStart } from 'opensearch-dashboards/public';
import { createRequestContextWithDataSourceId } from '../apps/configuration/utils/request-utils';
import { LOCAL_CLUSTER_ID } from '../../common';

export async function validateCurrentPassword(
  http: HttpStart,
  userName: string,
  currentPassword: string
): Promise<void> {
  await createRequestContextWithDataSourceId(LOCAL_CLUSTER_ID).httpPost({
    http,
    url: '/auth/login',
    body: {
      username: userName,
      password: currentPassword,
    },
  });
}
