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
import { API_ENDPOINT_TENANCY_CONFIGS } from '../constants';
import { httpGet, httpPut, httpPost } from './request-utils';
import { TenancyConfigSettings } from '../panels/tenancy-config/types';

export async function updateTenancyConfig(http: HttpStart, updateObject: TenancyConfigSettings) {
  return await httpPost(http, API_ENDPOINT_TENANCY_CONFIGS, updateObject);
}

export async function getTenancyConfig(http: HttpStart): Promise<TenancyConfigSettings> {
  const rawConfiguration = await httpGet<any>(http, API_ENDPOINT_TENANCY_CONFIGS);
  return rawConfiguration;
}
