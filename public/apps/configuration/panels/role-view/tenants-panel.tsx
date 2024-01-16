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

import React, { useState, useEffect } from 'react';
import {
  EuiInMemoryTable,
  EuiLink,
  EuiText,
  EuiGlobalToastList,
  EuiBasicTableColumn,
  EuiEmptyPrompt,
  EuiButton,
} from '@elastic/eui';
import { CoreStart } from 'opensearch-dashboards/public';
import { getCurrentUser } from '../../../../utils/auth-info-utils';
import { PanelWithHeader } from '../../utils/panel-with-header';
import {
  RoleTenantPermissionView,
  RoleTenantPermissionDetail,
  ResourceType,
  Action,
} from '../../types';
import { truncatedListView, tableItemsUIProps } from '../../utils/display-utils';
import {
  fetchTenants,
  transformTenantData,
  transformRoleTenantPermissionData,
  selectTenant,
} from '../../utils/tenant-utils';
import { DocLinks, RoleViewTenantInvalidText } from '../../constants';
import { PageId } from '../../types';
import { getNavLinkById } from '../../../../services/chrome_wrapper';
import { useToastState, createUnknownErrorToast } from '../../utils/toast-utils';
import { showTableStatusMessage } from '../../utils/loading-spinner-utils';
import { buildHashUrl } from '../../utils/url-builder';

interface RoleViewTenantsPanelProps {
  roleName: string;
  tenantPermissions: RoleTenantPermissionView[];
  errorFlag: boolean;
  coreStart: CoreStart;
  loading: boolean;
  isReserved: boolean;
}

export function TenantsPanel(props: RoleViewTenantsPanelProps) {
  const [tenantPermissionDetail, setTenantPermissionDetail] = React.useState<
    RoleTenantPermissionDetail[]
  >([]);
  const [currentUsername, setCurrentUsername] = React.useState('');
  const [toasts, addToast, removeToast] = useToastState();
  const [errorFlag, setErrorFlag] = React.useState(props.errorFlag);

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const rawTenantData = await fetchTenants(props.coreStart.http);
        const processedTenantData = transformTenantData(rawTenantData);
        setTenantPermissionDetail(
          transformRoleTenantPermissionData(props.tenantPermissions, processedTenantData)
        );
        const currentUser = await getCurrentUser(props.coreStart.http);
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

  const columns: Array<EuiBasicTableColumn<RoleTenantPermissionDetail>> = [
    {
      field: 'tenant_patterns',
      name: 'Name',
      render: truncatedListView(tableItemsUIProps),
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
            <EuiLink data-test-subj="view-dashboard" onClick={() => viewDashboard(tenant)}>
              View dashboard
            </EuiLink>
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
            <EuiLink data-test-subj="view-visualizations" onClick={() => viewVisualization(tenant)}>
              View visualizations
            </EuiLink>
          </>
        );
      },
    },
  ];

  const emptyListMessage = (
    <EuiEmptyPrompt
      title={<h3>No tenant permission</h3>}
      titleSize="s"
      actions={
        <EuiButton
          data-test-subj="addTenantPermission"
          disabled={props.isReserved}
          onClick={() => {
            window.location.href = buildHashUrl(ResourceType.roles, Action.edit, props.roleName);
          }}
        >
          Add tenant permission
        </EuiButton>
      }
    />
  );

  const headerText = 'Tenant permissions';
  return (
    <>
      <PanelWithHeader
        headerText={headerText}
        headerSubText="Tenants in OpenSearch Dashboards are spaces for saving index patterns, visualizations, dashboards, and other OpenSearch Dashboards objects.
        Tenants are useful for safely sharing your work with other OpenSearch Dashboards users. You can control which roles have access to a tenant and whether those roles have read or write access."
        helpLink={DocLinks.TenantPermissionsDoc}
        count={tenantPermissionDetail.length}
      >
        <EuiInMemoryTable
          data-test-subj="tenant-permission-container"
          tableLayout={'auto'}
          loading={tenantPermissionDetail === [] && !errorFlag}
          columns={columns}
          items={tenantPermissionDetail}
          sorting={{ sort: { field: 'type', direction: 'asc' } }}
          error={errorFlag ? 'Load data failed, please check console log for more detail.' : ''}
          message={showTableStatusMessage(props.loading, props.tenantPermissions, emptyListMessage)}
        />
      </PanelWithHeader>
      <EuiGlobalToastList toasts={toasts} toastLifeTimeMs={10000} dismissToast={removeToast} />
    </>
  );
}
