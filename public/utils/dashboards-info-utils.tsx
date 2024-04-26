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
import { API_ENDPOINT_DASHBOARDSINFO } from '../../common';
import { DashboardsInfo } from '../types';
import { createLocalClusterRequestContext } from '../apps/configuration/utils/request-utils';

export async function getDashboardsInfo(http: HttpStart) {
  return await createLocalClusterRequestContext().httpGet<DashboardsInfo>({
    http,
    url: API_ENDPOINT_DASHBOARDSINFO,
  });
}

export async function getDashboardsInfoSafe(http: HttpStart): Promise<DashboardsInfo | undefined> {
  return createLocalClusterRequestContext().httpGetWithIgnores<DashboardsInfo>({
    http,
    url: API_ENDPOINT_DASHBOARDSINFO,
    ignores: [401],
  });
}
