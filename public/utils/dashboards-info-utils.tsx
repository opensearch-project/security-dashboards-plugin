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
import { API_ENDPOINT_DASHBOARDSINFO, LOCAL_CLUSTER_ID } from '../../common';
import { createRequestContextWithDataSourceId } from '../apps/configuration/utils/request-utils';
import { DashboardsInfo } from '../types';

export async function getDashboardsInfo(http: HttpStart) {
  return await createRequestContextWithDataSourceId(LOCAL_CLUSTER_ID).httpGet<DashboardsInfo>({
    http,
    url: API_ENDPOINT_DASHBOARDSINFO,
  });
}

export async function getDashboardsInfoSafe(http: HttpStart): Promise<DashboardsInfo | undefined> {
  return createRequestContextWithDataSourceId(LOCAL_CLUSTER_ID).httpGetWithIgnores<DashboardsInfo>({
    http,
    url: API_ENDPOINT_DASHBOARDSINFO,
    ignores: [401],
  });
}
