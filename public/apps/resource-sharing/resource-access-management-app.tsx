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

import React from 'react';
import ReactDOM from 'react-dom';
import { I18nProvider } from '@osd/i18n/react';

import {
  EuiPage,
  EuiPageBody,
  EuiFlexGroup,
  EuiFlexItem,
  EuiPageHeader,
  EuiTitle,
  EuiText,
  EuiSpacer,
} from '@elastic/eui';

import { AppMountParameters, CoreStart } from '../../../../../src/core/public';
import { DataSourceManagementPluginSetup } from '../../../../../src/plugins/data_source_management/public';
import { SecurityPluginStartDependencies, ClientConfigType } from '../../types';

import { ResourceSharingPanel } from './resource-sharing-panel';
import { buildResourceApi } from '../../utils/resource-sharing-utils';

interface Props {
  coreStart: CoreStart;
  depsStart: SecurityPluginStartDependencies;
  params: AppMountParameters;
  config: ClientConfigType;
  redirect: string;
  dataSourceManagement?: DataSourceManagementPluginSetup;
}

const ResourceAccessManagementApp: React.FC<Props> = ({ coreStart, depsStart }) => {
  const {
    http,
    notifications: { toasts },
  } = coreStart;
  const TopNav = depsStart?.navigation?.ui?.TopNavMenu;

  return (
    <>
      {TopNav ? (
        <TopNav appName="resource-access" showSearchBar={false} useDefaultBehaviors={true} />
      ) : null}
      <EuiPage restrictWidth="2000px">
        <EuiPageBody component="main">
          <EuiPageHeader>
            <EuiFlexGroup direction="column" gutterSize="xs">
              <EuiFlexItem grow={false}>
                <EuiTitle size="l">
                  <h1>Resource Access Management</h1>
                </EuiTitle>
              </EuiFlexItem>
              <EuiFlexItem grow={false}>
                <EuiText color="subdued" size="s">
                  Manage sharing for detectors, forecasters, and more.
                </EuiText>
              </EuiFlexItem>
            </EuiFlexGroup>
          </EuiPageHeader>

          <EuiSpacer size="m" />

          <ResourceSharingPanel api={buildResourceApi(http)} toasts={toasts} />
        </EuiPageBody>
      </EuiPage>
    </>
  );
};

export function renderApp(
  coreStart: CoreStart,
  depsStart: SecurityPluginStartDependencies,
  params: AppMountParameters,
  config: ClientConfigType,
  redirect: string,
  dataSourceManagement?: DataSourceManagementPluginSetup
) {
  const deps: Props = {
    coreStart,
    depsStart,
    params,
    config,
    dataSourceManagement,
    redirect,
  };

  ReactDOM.render(
    <I18nProvider>
      <ResourceAccessManagementApp {...deps} />
    </I18nProvider>,
    params.element
  );

  return () => ReactDOM.unmountComponentAtNode(params.element);
}
