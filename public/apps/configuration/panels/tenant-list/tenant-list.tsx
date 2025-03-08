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

import { EuiPageHeader, EuiText, EuiTabs, EuiTab, EuiCallOut, EuiSmallButton } from '@elastic/eui';
import { Route } from 'react-router-dom';
import React, { useState, useMemo } from 'react';
import { ManageTab } from './manage_tab';
import { ConfigureTab1 } from './configure_tab1';
import { AppDependencies } from '../../../types';
import { ExternalLink } from '../../utils/display-utils';
import { DocLinks } from '../../constants';
import { getDashboardsInfo } from '../../../../utils/dashboards-info-utils';
import { LocalCluster } from '../../../../utils/datasource-utils';
import { SecurityPluginTopNavMenu } from '../../top-nav-menu';
import { PageHeader } from '../../header/header-components';
import { ResourceType } from '../../../../../common';

interface TenantListProps extends AppDependencies {
  tabID: string;
}

export function TenantList(props: TenantListProps) {
  const [isMultiTenancyEnabled, setIsMultiTenancyEnabled] = useState(false);
  const [selectedTabId, setSelectedTabId] = useState(props.tabID);

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const dashboardsInfo = await getDashboardsInfo(props.coreStart.http);
        setIsMultiTenancyEnabled(dashboardsInfo?.multitenancy_enabled || false);
      } catch (e) {
        console.log(e);
      }
    };
    fetchData();
  }, [props.coreStart.http, selectedTabId]);

  const tenancyDisabledWarning = (
    <>
      <EuiCallOut title="Tenancy is disabled" color="warning" iconType="iInCircle">
        <p>
          Tenancy is currently disabled and users don&apos;t have access to this feature. Enable
          tenancy through the configure tenancy page.
        </p>
        <EuiSmallButton
          id="switchToConfigure"
          color="warning"
          onClick={() => onSelectedTabChanged('Configure')}
        >
          Configure tenancy
        </EuiSmallButton>
      </EuiCallOut>
    </>
  );

  const tabs = useMemo(
    () => [
      {
        id: 'Manage',
        name: 'Manage',
        content: (
          <Route
            render={() => {
              return (
                <>
                  <ManageTab {...props} />
                </>
              );
            }}
          />
        ),
      },
      {
        id: 'Configure',
        name: 'Configure',
        content: (
          <Route
            render={() => {
              return <ConfigureTab1 {...props} />;
            }}
          />
        ),
      },
    ],
    [props]
  );

  const selectedTabContent = useMemo(() => {
    return tabs.find((obj) => obj.id === selectedTabId)?.content;
  }, [selectedTabId, tabs]);

  const onSelectedTabChanged = (id: string) => {
    setSelectedTabId(id);
  };

  const renderTabs = () => {
    return tabs.map((tab, index) => (
      <EuiTab
        key={index}
        href={tab.href}
        onClick={() => onSelectedTabChanged(tab.id)}
        isSelected={tab.id === selectedTabId}
        disabled={tab.disabled}
        prepend={tab.prepend}
        append={tab.append}
      >
        {tab.name}
      </EuiTab>
    ));
  };

  const descriptionData = [
    {
      renderComponent: (
        <EuiText size="s" color="subdued" grow={true} textAlign={'left'}>
          Tenants in OpenSearch Dashboards are spaces for saving index patterns, visualizations,
          dashboards, and other OpenSearch
          <br /> Dashboards objects. Tenants are useful for safely sharing your work with other
          OpenSearch Dashboards users. You can control <br />
          which roles have access to a tenant and whether those roles have read or write access.{' '}
          <ExternalLink href={DocLinks.MultiTenancyDoc} />
        </EuiText>
      ),
    },
  ];

  return (
    <>
      <SecurityPluginTopNavMenu
        {...props}
        dataSourcePickerReadOnly={true}
        setDataSource={() => {}}
        selectedDataSource={LocalCluster}
      />
      <PageHeader
        navigation={props.depsStart.navigation}
        coreStart={props.coreStart}
        descriptionControls={descriptionData}
        fallBackComponent={
          <>
            <EuiPageHeader>
              <EuiText size="s">
                <h1>Dashboards multi-tenancy</h1>
              </EuiText>
            </EuiPageHeader>
            <EuiText size="s" color="subdued" grow={true} textAlign={'left'}>
              Tenants in OpenSearch Dashboards are spaces for saving index patterns, visualizations,
              dashboards, and other OpenSearch Dashboards objects. Tenants are useful for safely
              sharing your work with other OpenSearch Dashboards users. You can control which roles
              have access to a tenant and whether those roles have read or write access.{' '}
              <ExternalLink href={DocLinks.MultiTenancyDoc} />
            </EuiText>
          </>
        }
        resourceType={ResourceType.tenants}
      />

      <EuiTabs size="s">{renderTabs()}</EuiTabs>
      {!isMultiTenancyEnabled && selectedTabId === 'Manage' && tenancyDisabledWarning}
      {selectedTabContent}
    </>
  );
}
