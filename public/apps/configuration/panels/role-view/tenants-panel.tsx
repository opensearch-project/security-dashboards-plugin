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

import React from 'react';
import { EuiInMemoryTable } from '@elastic/eui';
import { PanelWithHeader } from '../../utils/panel-with-header';
import { RoleTenantPermissionView } from '../../types';
import { truncatedListView } from '../../utils/display-utils';

const columns = [
  {
    field: 'tenant_patterns',
    name: 'Name',
    render: truncatedListView(),
    truncateText: true,
    sortable: true,
  },
  {
    field: 'permissionType',
    name: 'Read/write permission',
  },
];

export function TenantsPanel(props: {
  tenantPermissions: RoleTenantPermissionView[];
  errorFlag: boolean;
}) {
  const headerText = 'Tenants (' + props.tenantPermissions.length + ')';

  return (
    <PanelWithHeader
      headerText={headerText}
      headerSubText="Tenants in Kibana are spaces for saving index patterns, visualizations, dashboards, and other Kibana objects. 
      Tenants are useful for safely sharing your work with other Kibana users. 
      You can control which roles have access to a tenant and whether those roles have read or write access."
      helpLink="/"
    >
      <EuiInMemoryTable
        loading={props.tenantPermissions === [] && !props.errorFlag}
        columns={columns}
        items={props.tenantPermissions}
        // itemId={'name'}
        sorting={{ sort: { field: 'type', direction: 'asc' } }}
        error={props.errorFlag ? 'Load data failed, please check console log for more detail.' : ''}
      />
    </PanelWithHeader>
  );
}
