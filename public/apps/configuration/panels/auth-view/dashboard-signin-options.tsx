/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 *
 * Modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
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
import { updateDashboardSignInOptions } from '../../../../utils/dashboards-info-utils';
import { DashboardOption, DashboardSignInOptions } from '../../types';
import { createErrorToast, createSuccessToast, useToastState } from '../../utils/toast-utils';
import { SignInOptionsModal } from './signin-options-modal';

interface SignInOptionsPanelProps {
  authc: [];
  signInEnabledOptions: DashboardSignInOptions[];
  http: HttpSetup;
  isAnonymousAuthEnable: boolean;
}

export const columns: Array<EuiBasicTableColumn<DashboardOption>> = [
  {
    field: 'displayName',
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
  const { authc, signInEnabledOptions, http, isAnonymousAuthEnable } = props;

  const domains = keys(authc);
  const [toasts, addToast, removeToast] = useToastState();
  const [dashboardOptions, setDashboardOptions] = useState<DashboardOption[]>([]);

  enum makeAuthTypeHumanReadable {
    BASIC = 'Basic Authentication',
    SAML = 'SAML',
    OPENID = 'OpenID Connect',
    ANONYMOUS = 'Anonymous',
  }

  useEffect(() => {
    const getDasboardOptions = () => {
      const options = domains
        .map((domain) => {
          const data = get(authc, domain);

          const option = data.http_authenticator.type.toUpperCase();
          if (option in DashboardSignInOptions) {
            const dashboardOption: DashboardOption = {
              name: option,
              status: signInEnabledOptions.indexOf(option) > -1,
              displayName: makeAuthTypeHumanReadable[option],
            };
            return dashboardOption;
          }
        })
        .filter((option) => option != null)
        .filter(
          (option, index, arr) => arr.findIndex((opt) => opt?.name === option?.name) === index
        ) as DashboardOption[];
      setDashboardOptions(options);
    };

    if (signInEnabledOptions.length > 0 && dashboardOptions.length === 0) {
      getDasboardOptions();
    }
  }, [signInEnabledOptions, authc, dashboardOptions, domains]);

  useEffect(() => {
    if (isAnonymousAuthEnable) {
      const option = DashboardSignInOptions.ANONYMOUS;
      const anonymousOption: DashboardOption = {
        name: DashboardSignInOptions[option],
        status: signInEnabledOptions.indexOf(DashboardSignInOptions[option]) > -1,
        displayName: makeAuthTypeHumanReadable.ANONYMOUS,
      };

      setDashboardOptions((prevState) => [...prevState, anonymousOption]);
    }
  }, [signInEnabledOptions, isAnonymousAuthEnable]);

  const handleUpdate = async (newSignInOptions: DashboardOption[]) => {
    await updateDashboardSignInOptions(
      props.http,
      newSignInOptions.map((opt) => opt.name as DashboardSignInOptions)
    )
      .then(() => {
        setDashboardOptions((prevOptions) =>
          prevOptions.map((option) => {
            option.status = newSignInOptions.includes(option);
            return option;
          })
        );

        addToast(
          createSuccessToast('updatePassed', 'Dashboard SignIn Options', 'Changes applied.')
        );
      })
      .catch((e) => {
        console.log('The sign in options could not be updated');
        console.log(e);
        addToast(
          createErrorToast('updatedError', 'Dashboard SignIn Options', 'Error updating values.')
        );
      });
  };

  return (
    <EuiPanel>
      <EuiPageContentHeader>
        <EuiPageContentHeaderSection>
          <EuiTitle size="s">
            <h3>Dashboards sign-in options</h3>
          </EuiTitle>
          <EuiText size="xs" color="subdued">
            <p>
              Configure one or multiple authentication options to appear on the sign-in window for
              OpenSearch Dashboards.
            </p>
          </EuiText>
        </EuiPageContentHeaderSection>
        <EuiPageContentHeaderSection>
          <EuiFlexGroup>
            <SignInOptionsModal
              dashboardOptions={dashboardOptions}
              setDashboardOptions={setDashboardOptions}
              handleUpdate={handleUpdate}
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
        sorting={{ sort: { field: 'displayName', direction: 'asc' } }}
      />
      <EuiGlobalToastList toasts={toasts} toastLifeTimeMs={3000} dismissToast={removeToast} />
    </EuiPanel>
  );
}
