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

import {
  EuiBasicTableColumn,
  EuiFlexGroup,
  EuiGlobalToastList,
  EuiHealth,
  EuiHorizontalRule,
  EuiInMemoryTable,
  EuiPageContentHeader,
  EuiPageContentHeaderSection,
  EuiPanel,
  EuiText,
  EuiTitle,
} from '@elastic/eui';
import { get, keys } from 'lodash';
import { HttpSetup } from 'opensearch-dashboards/public';
import React, { useEffect, useState } from 'react';
import { DashboardOption, DashboardSignInOptions } from '../../types';
import { useToastState } from '../../utils/toast-utils';
import { SignInOptionsModal } from './signin-options-modal';

interface SignInOptionsPanelProps {
  authc: [];
  signInEnabledOptions: DashboardSignInOptions[];
  http: HttpSetup;
}

export const columns: EuiBasicTableColumn<DashboardOption>[] = [
  {
    field: 'name',
    name: 'Name',
    'data-test-subj': 'name',
    mobileOptions: {
      render: (opt: DashboardOption) => <span>{opt.name}</span>,
      header: false,
      truncateText: false,
      enlarge: true,
      width: '100%',
    },
    sortable: true,
  },
  {
    field: 'status',
    name: 'Status',
    dataType: 'boolean',
    render: (enable: DashboardOption['status']) => {
      const color = enable ? 'success' : 'danger';
      const label = enable ? 'Enable' : 'Disable';
      return <EuiHealth color={color}>{label}</EuiHealth>;
    },
  },
];

export function SignInOptionsPanel(props: SignInOptionsPanelProps) {
  const domains = keys(props.authc);
  const [toasts, addToast, removeToast] = useToastState();
  const [dashboardOptions, setDashboardOptions] = useState<DashboardOption[]>([]);

  useEffect(() => {
    const getDasboardOptions = () => {
      const options = domains
        .map((domain) => {
          const data = get(props.authc, domain);

          let option = data.http_authenticator.type.toUpperCase();
          if (option in DashboardSignInOptions) {
            const dashboardOption: DashboardOption = {
              name: option,
              status: props.signInEnabledOptions.indexOf(option) > -1,
            };

            return dashboardOption;
          }
        })
        .filter((option) => option != null)
        //Remove duplicates
        .filter(
          (option, index, arr) => arr.findIndex((opt) => opt?.name == option?.name) === index
        ) as DashboardOption[];

      setDashboardOptions(options);
    };

    if (props.signInEnabledOptions.length > 0 && dashboardOptions.length == 0) {
      getDasboardOptions();
    }
  }, [props.signInEnabledOptions, dashboardOptions]);

  return (
    <EuiPanel>
      <EuiPageContentHeader>
        <EuiPageContentHeaderSection>
          <EuiTitle size="s">
            <h3>Dashboard Sign In Options</h3>
          </EuiTitle>
          <EuiText size="xs" color="subdued">
            <p>
              Configure one or multiple authentication options to appear on the sign-in windows for
              OpenSearch Dashboard.
            </p>
          </EuiText>
        </EuiPageContentHeaderSection>
        <EuiPageContentHeaderSection>
          <EuiFlexGroup>
            <SignInOptionsModal
              dashboardOptions={dashboardOptions}
              setDashboardOptions={setDashboardOptions}
              http={props.http}
              addToast={addToast}
            />
          </EuiFlexGroup>
        </EuiPageContentHeaderSection>
      </EuiPageContentHeader>
      <EuiHorizontalRule margin="m" />
      <EuiInMemoryTable
        tableLayout={'auto'}
        columns={columns}
        items={dashboardOptions}
        itemId={'signin_options'}
        sorting={{ sort: { field: 'name', direction: 'asc' } }}
      />
      <EuiGlobalToastList toasts={toasts} toastLifeTimeMs={3000} dismissToast={removeToast} />
    </EuiPanel>
  );
}
