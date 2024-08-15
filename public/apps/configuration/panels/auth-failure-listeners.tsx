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

import { EuiButton, EuiInMemoryTable, EuiIcon } from '@elastic/eui';
import React, { useContext, useState } from 'react';
import { AppDependencies } from '../../types';
import { API_ENDPOINT_AUTHFAILURELISTENERS } from '../constants';
import { createRequestContextWithDataSourceId } from '../utils/request-utils';
import { SecurityPluginTopNavMenu } from '../top-nav-menu';
import { DataSourceContext } from '../app-router';
import { getResourceUrl } from '../utils/resource-utils';

export function AuthFailureListeners(props: AppDependencies) {
  const dataSourceEnabled = !!props.depsStart.dataSource?.dataSourceEnabled;
  const { dataSource, setDataSource } = useContext(DataSourceContext)!;

  const [listeners, setListeners] = useState([]);

  const fetchData = async () => {
    const data = await createRequestContextWithDataSourceId(dataSource.id).httpGet<any>({
      http: props.coreStart.http,
      url: API_ENDPOINT_AUTHFAILURELISTENERS,
    });
    setListeners(data.data);
  };

  const handleDelete = async (name: string) => {
    await createRequestContextWithDataSourceId(dataSource.id).httpDelete<any>({
      http: props.coreStart.http,
      url: getResourceUrl(API_ENDPOINT_AUTHFAILURELISTENERS, name),
    });
  };

  const createDummyAuthFailureListener = async () => {
    await createRequestContextWithDataSourceId(dataSource.id).httpPost<any>({
      http: props.coreStart.http,
      url: getResourceUrl(API_ENDPOINT_AUTHFAILURELISTENERS, 'test'),
      body: {
        type: 'ip',
        authentication_backend: 'test',
        allowed_tries: 10,
        time_window_seconds: 3600,
        block_expiry_seconds: 600,
        max_blocked_clients: 100000,
        max_tracked_clients: 100000,
      },
    });
  };

  const columns = [
    {
      field: 'name',
      name: 'Name',
    },
    {
      field: 'type',
      name: 'Type',
    },
    {
      field: 'authentication_backend',
      name: 'Authentication backend',
    },
    {
      field: 'allowed_tries',
      name: 'Allowed tries',
    },
    {
      field: 'time_window_seconds',
      name: 'Time window (sec)',
    },
    {
      field: 'block_expiry_seconds',
      name: 'Block expiry (sec)',
    },
    {
      field: 'max_blocked_clients',
      name: 'Max blocked clients',
    },
    {
      field: 'max_tracked_clients',
      name: 'Max tracked clients',
    },
    {
      field: 'name',
      name: 'Actions',
      render: (name) => <EuiIcon type="trash" onClick={() => handleDelete(name)} />,
    },
  ];

  return (
    <>
      <div className="panel-restrict-width">
        <SecurityPluginTopNavMenu
          {...props}
          dataSourcePickerReadOnly={false}
          setDataSource={setDataSource}
          selectedDataSource={dataSource}
        />
      </div>
      <EuiButton onClick={fetchData}>GET</EuiButton>
      <EuiInMemoryTable
        tableLayout={'auto'}
        columns={columns}
        items={listeners}
        itemId={'domain_name'}
        pagination={true}
        sorting={true}
      />

      <EuiButton onClick={createDummyAuthFailureListener}>CREATE</EuiButton>
    </>
  );
}
