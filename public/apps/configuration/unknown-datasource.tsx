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
import { EuiPageHeader, EuiTitle, EuiText, EuiPageBody } from '@elastic/eui';
import { AppDependencies } from '../types';

export type UnknownDataSourceProps = AppDependencies;

export const UnknownDataSourcePage = React.memo((props: UnknownDataSourceProps) => {
  return (
    <>
      <EuiPageHeader>
        <EuiTitle size="l">
          <h1>Unable to list data-source connections</h1>
        </EuiTitle>
      </EuiPageHeader>
      <EuiPageBody>
        <EuiText>
          <h4>
            It seems like you do not have access to list all data-source connections.
            <br />
            Likely cause is that aggregation view setting
            `opensearch_security.multitenancy.enable_aggregation_view` is enabled.
            <br />
            Please contact your administrator to grant you access to global tenant to be able to
            view the data-sources.
          </h4>
        </EuiText>
      </EuiPageBody>
    </>
  );
});
