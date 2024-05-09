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
import { DataSourceOption } from 'src/plugins/data_source_management/public/components/data_source_menu/types';
import { AppDependencies } from '../types';
import { setDataSourceInUrl } from '../../utils/datasource-utils';
import {
  EuiPageHeader,
  EuiTitle,
  EuiButton
} from '@elastic/eui'

const LocalCluster = {
  label: 'Local Cluster',
  id: ''
};

export interface UnknownDataSourceProps extends AppDependencies {
  setDataSource: React.Dispatch<React.SetStateAction<DataSourceOption>>;
}

export const UnknownDataSourcePage = React.memo(
  (props: UnknownDataSourceProps) => {
    const {
      setDataSource,
    } = props;

    const wrapSetDataSourceWithUpdateUrl = () => {
      setDataSourceInUrl(LocalCluster);
      console.log(window.location.href)
      setDataSource(LocalCluster);
    };

    return (
      <>
      <EuiPageHeader>
        <EuiTitle size="l">
          <h1>Unknown DataSource</h1>
        </EuiTitle>
      </EuiPageHeader>
      <EuiButton title="Switch to default" onClick={() => wrapSetDataSourceWithUpdateUrl()}>Switch to default</EuiButton>
      </>
    );
  });
