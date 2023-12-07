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
import { API_ENDPOINT_DASHBOARDSINFO, API_ENDPOINT_DASHBOARD_SIGNIN_OPTIONS } from '../../common';
import { httpGet, httpGetWithIgnores, httpPut } from '../apps/configuration/utils/request-utils';
import { DashboardsInfo } from '../types';
import { DashboardSignInOptions } from '../apps/configuration/types';

export async function getDashboardsInfo(http: HttpStart) {
  return await httpGet<DashboardsInfo>(http, API_ENDPOINT_DASHBOARDSINFO);
}

export async function getDashboardsInfoSafe(http: HttpStart): Promise<DashboardsInfo | undefined> {
  return httpGetWithIgnores<DashboardsInfo>(http, API_ENDPOINT_DASHBOARDSINFO, [401]);
}

export async function getDashboardsSignInOptions(http: HttpStart) {
  return await httpGet<DashboardSignInOptions[]>(http, API_ENDPOINT_DASHBOARD_SIGNIN_OPTIONS);
}

export async function updateDashboardSignInOptions(
  http: HttpStart,
  signInOptions: DashboardSignInOptions[]
) {
  return await httpPut(http, API_ENDPOINT_DASHBOARD_SIGNIN_OPTIONS, {
    dashboard_signin_options: signInOptions,
  });
}
