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

import React from 'react';
import { DataSourceSelectableConfig } from 'src/plugins/data_source_management/public';
import { DataSourceOption } from 'src/plugins/data_source_management/public/components/data_source_menu/types';
import { AppDependencies } from '../types';

export interface TopNavMenuProps extends AppDependencies {
  dataSourcePickerReadOnly: boolean;
  setDataSource: React.Dispatch<React.SetStateAction<DataSourceOption>>;
  selectedDataSource: DataSourceOption;
}

const compatibleVersion = new Set([
  '2.1',
  '2.2',
  '2.3',
  '2.4',
  '2.5',
  '2.6',
  '2.7',
  '2.8',
  '2.9',
  '2.10',
  '2.11',
  '2.12',
]);

export const SecurityPluginTopNavMenu = (props: TopNavMenuProps) => {
  const {
    coreStart,
    depsStart,
    params,
    dataSourceManagement,
    setDataSource,
    selectedDataSource,
    dataSourcePickerReadOnly,
  } = props;
  const { setHeaderActionMenu } = params;
  const DataSourceMenu = dataSourceManagement?.ui.getDataSourceMenu<DataSourceSelectableConfig>();

  const dataSourceEnabled = !!depsStart.dataSource?.dataSourceEnabled;

  return dataSourceEnabled ? (
    <DataSourceMenu
      setMenuMountPoint={setHeaderActionMenu}
      componentType={dataSourcePickerReadOnly ? 'DataSourceView' : 'DataSourceSelectable'}
      componentConfig={{
        savedObjects: coreStart.savedObjects.client,
        notifications: coreStart.notifications,
        activeOption: [selectedDataSource],
        dataSourceFilter: (ds) => compatibleVersion.has(ds.attributes.version),
        onSelectedDataSources: (dataSources) => {
          // single select for now
          setDataSource(dataSources[0]);
        },
        fullWidth: true,
      }}
    />
  ) : null;
};
