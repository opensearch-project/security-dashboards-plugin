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
import { DataSourceOption } from '../../../../../src/plugins/data_source_management/public/components/data_source_selector/data_source_selector';
import { PLUGIN_NAME } from '../../../common';
import { AppDependencies } from '../types';

export interface TopNavMenuProps extends AppDependencies {
  dataSourcePickerReadOnly: boolean;
  setDataSource: React.Dispatch<React.SetStateAction<DataSourceOption>>;
  selectedDataSource: DataSourceOption;
}

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
  const DataSourceMenu = dataSourceManagement?.ui.getDataSourceMenu();

  const dataSourceEnabled = !!depsStart.dataSource?.dataSourceEnabled;

  return dataSourceEnabled ? (
    <DataSourceMenu
      setMenuMountPoint={setHeaderActionMenu}
      componentType={dataSourcePickerReadOnly ? 'DataSourceView' : 'DataSourceSelectable'}
      componentConfig={{
        savedObjects: coreStart.savedObjects.client,
        appName: PLUGIN_NAME,
        showDataSourceSelectable: dataSourceEnabled,
        notifications: coreStart.notifications,
        activeOption: [selectedDataSource],
        onSelectedDataSources: (dataSources: DataSourceOption[]) => {
          // single select for now
          setDataSource(dataSources[0]);
        },
      }}
    />
  ) : null;
};
