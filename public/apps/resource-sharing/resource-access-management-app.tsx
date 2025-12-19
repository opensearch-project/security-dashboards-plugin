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

import './_index.scss';

import React, { useContext, useState, createContext } from 'react';
import ReactDOM from 'react-dom';
import { I18nProvider } from '@osd/i18n/react';
import { EuiPage, EuiPageBody, EuiPageHeader, EuiTitle, EuiText, EuiSpacer } from '@elastic/eui';
import { DataSourceOption } from 'src/plugins/data_source_management/public';

import { AppMountParameters, CoreStart } from '../../../../../src/core/public';
import { DataSourceManagementPluginSetup } from '../../../../../src/plugins/data_source_management/public';
import { SecurityPluginStartDependencies, ClientConfigType } from '../../types';

import { ResourceSharingPanel } from './resource-sharing-panel';
import { buildResourceApi } from '../../utils/resource-sharing-utils';
import { SecurityPluginTopNavMenu } from '../configuration/top-nav-menu';
import { getDataSourceFromUrl, LocalCluster } from '../../utils/datasource-utils';

export interface DataSourceContextType {
  dataSource: DataSourceOption;
  setDataSource: React.Dispatch<React.SetStateAction<DataSourceOption>>;
}

export const DataSourceContext = createContext<DataSourceContextType | null>(null);

interface Props {
  coreStart: CoreStart;
  depsStart: SecurityPluginStartDependencies;
  params: AppMountParameters;
  config: ClientConfigType;
  redirect: string;
  dataSourceManagement?: DataSourceManagementPluginSetup;
}

const ResourceAccessManagementApp: React.FC<Props> = (props) => {
  const {
    http,
    notifications: { toasts },
  } = props.coreStart;
  const { dataSource, setDataSource } = useContext(DataSourceContext)!;

  const api = React.useMemo(() => buildResourceApi(http, dataSource?.id) as any, [
    http,
    dataSource?.id,
  ]);

  return (
    <>
      <SecurityPluginTopNavMenu
        {...(props as any)}
        dataSourcePickerReadOnly={false}
        setDataSource={setDataSource}
        selectedDataSource={dataSource}
      />
      <EuiPage restrictWidth="2000px">
        <EuiPageBody component="main">
          <EuiPageHeader>
            <div>
              <EuiTitle size="l">
                <h1>Resource Access Management</h1>
              </EuiTitle>
              <EuiText color="subdued" size="s">
                Manage sharing for detectors, forecasters, and more.
              </EuiText>
            </div>
          </EuiPageHeader>
          <EuiSpacer size="m" />
          <ResourceSharingPanel api={api} toasts={toasts} />
        </EuiPageBody>
      </EuiPage>
    </>
  );
};

function ResourceAccessManagementAppWithContext(props: Props) {
  const dataSourceEnabled = !!props.depsStart.dataSource?.dataSourceEnabled;
  const dataSourceFromUrl = dataSourceEnabled ? getDataSourceFromUrl() : LocalCluster;
  const [dataSource, setDataSource] = useState<DataSourceOption>(dataSourceFromUrl);

  return (
    <DataSourceContext.Provider value={{ dataSource, setDataSource }}>
      <ResourceAccessManagementApp {...props} />
    </DataSourceContext.Provider>
  );
}

export function renderApp(
  coreStart: CoreStart,
  depsStart: SecurityPluginStartDependencies,
  params: AppMountParameters,
  config: ClientConfigType,
  redirect: string,
  dataSourceManagement?: DataSourceManagementPluginSetup
) {
  const deps = { coreStart, depsStart, params, config, redirect, dataSourceManagement };

  const element = (
    // @ts-ignore
    <I18nProvider>
      <ResourceAccessManagementAppWithContext {...deps} />
    </I18nProvider>
  );

  ReactDOM.render(element, params.element);

  return () => ReactDOM.unmountComponentAtNode(params.element);
}
