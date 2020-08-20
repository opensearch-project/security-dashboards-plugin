/*
 *   Copyright 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
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

import React, { useState, useEffect } from 'react';
import { EuiInMemoryTable, EuiLink, EuiText, EuiGlobalToastList } from '@elastic/eui';
import { CoreStart } from 'kibana/public';
import { getAuthInfo } from '../../../../utils/auth-info-utils';
import { PanelWithHeader } from '../../utils/panel-with-header';
import { RoleTenantPermissionView, RoleTenantPermissionDetail } from '../../types';
import { truncatedListView } from '../../utils/display-utils';
import {
  fetchTenants,
  transformTenantData,
  transformRoleTenantPermissionData,
  selectTenant,
} from '../../utils/tenant-utils';
import { RoleViewTenantInvalidText } from '../../constants';
import { PageId } from '../../types';
import { getNavLinkById } from '../../../../services/chrome_wrapper';
import { useToastState, createUnknownErrorToast } from '../../utils/toast-utils';

interface RoleViewTenantsPanelProps {
  tenantPermissions: RoleTenantPermissionView[];
  errorFlag: boolean;
  coreStart: CoreStart;
}

export function TenantsPanel(props: RoleViewTenantsPanelProps) {
  const [tenantPermissionDetail, setTenantPermissionDetail] = useState<
    RoleTenantPermissionDetail[]
  >([]);
  const [currentUsername, setCurrentUsername] = useState('');
  const [toasts, addToast, removeToast] = useToastState();
  const [errorFlag, setErrorFlag] = useState(props.errorFlag);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const rawTenantData = await fetchTenants(props.coreStart.http);
        const processedTenantData = transformTenantData(rawTenantData, false);
        setTenantPermissionDetail(
          transformRoleTenantPermissionData(props.tenantPermissions, processedTenantData)
        );
        const currentUser = (await getAuthInfo(props.coreStart.http)).user_name;
        setCurrentUsername(currentUser);
      } catch (e) {
        console.log(e);
        setErrorFlag(true);
      }
    };

    fetchData();
  }, [props]);

  const viewDashboard = async (tenantName: string) => {
    try {
      await selectTenant(props.coreStart.http, {
        tenant: tenantName,
        username: currentUsername,
      });
      window.location.href = getNavLinkById(props.coreStart, PageId.dashboardId);
    } catch (e) {
      console.log(e);
      addToast(createUnknownErrorToast('viewDashboard', `view dashboard for ${tenantName} tenant`));
    }
  };

  const viewVisualization = async (tenantName: string) => {
    try {
      await selectTenant(props.coreStart.http, {
        tenant: tenantName,
        username: currentUsername,
      });
      window.location.href = getNavLinkById(props.coreStart, PageId.visualizationId);
    } catch (e) {
      console.log(e);
      addToast(
        createUnknownErrorToast('viewVisualization', `view visualization for ${tenantName} tenant`)
      );
    }
  };

  const columns = [
    {
      field: 'tenant_patterns',
      name: 'Name',
      render: truncatedListView(),
      truncateText: true,
      sortable: true,
    },
    {
      field: 'description',
      name: 'Description',
      truncateText: true,
    },
    {
      field: 'permissionType',
      name: 'Read/write permission',
    },
    {
      field: 'tenantValue',
      name: 'Dashboard',
      render: (tenant: string) => {
        if (tenant === RoleViewTenantInvalidText) {
          return (
            <>
              <EuiText size="s">{RoleViewTenantInvalidText}</EuiText>
            </>
          );
        }
        return (
          <>
            <EuiLink onClick={() => viewDashboard(tenant)}>View dashboard</EuiLink>
          </>
        );
      },
    },
    {
      field: 'tenantValue',
      name: 'Visualizations',
      render: (tenant: string) => {
        if (tenant === RoleViewTenantInvalidText) {
          return (
            <>
              <EuiText size="s">{RoleViewTenantInvalidText}</EuiText>
            </>
          );
        }
        return (
          <>
            <EuiLink onClick={() => viewVisualization(tenant)}>View visualizations</EuiLink>
          </>
        );
      },
    },
  ];

  const headerText = 'Tenant permissions';
  return (
    <>
      <PanelWithHeader
        headerText={headerText}
        headerSubText="Tenants in Kibana are spaces for saving index patterns, visualizations, dashboards, and other Kibana objects. 
        Tenants are useful for safely sharing your work with other Kibana users. 
        You can control which roles have access to a tenant and whether those roles have read or write access."
        helpLink="/"
        count={tenantPermissionDetail.length}
      >
        <EuiInMemoryTable
          loading={tenantPermissionDetail === [] && !errorFlag}
          columns={columns}
          items={tenantPermissionDetail}
          sorting={{ sort: { field: 'type', direction: 'asc' } }}
          error={errorFlag ? 'Load data failed, please check console log for more detail.' : ''}
        />
      </PanelWithHeader>
      <EuiGlobalToastList toasts={toasts} toastLifeTimeMs={10000} dismissToast={removeToast} />
    </>
  );
}
