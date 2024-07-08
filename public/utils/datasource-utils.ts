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

import { BehaviorSubject } from 'rxjs';
import { DataSourceOption } from 'src/plugins/data_source_management/public/components/data_source_menu/types';

const DATASOURCEURLKEY = 'dataSource';

export function getClusterInfo(dataSourceEnabled: boolean, cluster: DataSourceOption) {
  if (dataSourceEnabled) {
    return `for ${cluster.label || 'Local cluster'}`;
  }
  return '';
}

export function getDataSourceFromUrl(): DataSourceOption {
  const urlParams = new URLSearchParams(window.location.search);
  const dataSourceParam = (urlParams && urlParams.get(DATASOURCEURLKEY)) || '{}';
  // following block is needed if the dataSource param is set to non-JSON value, say 'undefined'
  try {
    return JSON.parse(dataSourceParam);
  } catch (e) {
    return JSON.parse('{}'); // Return an empty object or some default value if parsing fails
  }
}

export function getDataSourceEnabledUrl(dataSource: DataSourceOption) {
  const url = new URL(window.location.href);
  url.searchParams.set(DATASOURCEURLKEY, JSON.stringify(dataSource));
  return url;
}

export function setDataSourceInUrl(dataSource: DataSourceOption) {
  window.history.replaceState({}, '', getDataSourceEnabledUrl(dataSource).toString());
}

export const LocalCluster = { label: 'Local cluster', id: '' };

export const dataSource$ = new BehaviorSubject<DataSourceOption>(
  getDataSourceFromUrl() || LocalCluster
);

export function setDataSource(dataSource: DataSourceOption) {
  dataSource$.next(dataSource);
}
