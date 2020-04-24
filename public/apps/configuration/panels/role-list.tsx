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
import {
  EuiFlexGroup,
  EuiText,
  EuiIcon,
  EuiPageHeader,
  EuiTitle,
  EuiPageContent,
  EuiPageContentHeader,
  EuiPageContentHeaderSection,
  EuiLink,
  EuiFlexItem,
  EuiButton,
  EuiPageBody,
  EuiInMemoryTable,
} from '@elastic/eui';
import { AppDependencies } from '../../types';

function truncatedListView(limit = 3) {
  return (items: string[]) => {
    // Show - to indicate empty
    if (items == undefined || items.length == 0) {
      return (
        <EuiFlexGroup direction="column" style={{ margin: '1px' }}>
          <EuiText size="xs">-</EuiText>
        </EuiFlexGroup>
      );
    }

    // If number of items over than limit, truncate and show ...
    return (
      <EuiFlexGroup direction="column" style={{ margin: '1px' }}>
        {items.slice(0, limit).map(item => (
          <EuiText size="xs">{item}</EuiText>
        ))}
        {items.length > limit && <EuiText size="xs">...</EuiText>}
      </EuiFlexGroup>
    );
  };
}

const columns = [
  {
    field: 'role_name',
    name: 'Role',
    sortable: true,
  },
  {
    field: 'cluster_permissions',
    name: 'Cluster permissions',
    render: truncatedListView(),
    truncateText: true,
  },
  {
    field: 'index_permissions',
    name: 'Index patterns',
    render: truncatedListView(),
    truncateText: true,
  },
  {
    field: 'internal_users',
    name: 'Internal Users',
    render: truncatedListView(),
  },
  {
    field: 'backend_roles',
    name: 'Backend Roles',
    render: truncatedListView(),
  },
  {
    field: 'tenant_permissions',
    name: 'Tenant patterns',
    render: truncatedListView(),
  },
  {
    field: 'reserved',
    name: 'Customization',
    render: (reserved: string) => (
      <>
        <EuiIcon type={reserved ? 'lock' : 'pencil'} />
        <EuiText size="xs">{reserved ? 'Reserved' : 'Custom'}</EuiText>
      </>
    ),
  },
];

export function RoleList(props: AppDependencies) {
  const [roleData, setRoleData] = useState([]);
  const [errorFlag, setErrorFlag] = useState(false);
  useEffect(() => {
    const fetchData = async () => {
      try {
        // @ts-ignore : not used
        const rawRoleData = await props.coreStart.http.get(
          '/api/v1/opendistro_security/configuration/roles'
        );
        // @ts-ignore : not used
        const rawRoleMappingData = await props.coreStart.http.get(
          '/api/v1/opendistro_security/configuration/rolesmapping'
        );
        // TODO: Join and tranform raw data'
        // @ts-ignore : implicit any
        const processedData = [];
        // @ts-ignore : error TS2345: Argument of type 'any[]' is not assignable to parameter of type 'SetStateAction<never[]>'
        setRoleData(processedData);
        
      } catch (e) {
        console.log(e);
        setErrorFlag(true);
      }
    };

    fetchData();
  }, []);

  return (
    <>
      <EuiPageHeader>
        <EuiTitle size="l">
          <h1>Roles</h1>
        </EuiTitle>
      </EuiPageHeader>
      <EuiPageContent>
        <EuiPageContentHeader id="role-table-container">
          <EuiPageContentHeaderSection>
            <EuiTitle>
              <h3>Roles</h3>
            </EuiTitle>
            <EuiText size="s" color="subdued">
              Roles are the core way of controlling access to your cluster. Roles contain any
              combinatioin of cluster-wide permission, index-specific permissions, document- and
              field-level security, and tenants. Then you map users to these roles so that users
              gain those permissions. <EuiLink external={true}>Learn More</EuiLink>
            </EuiText>
          </EuiPageContentHeaderSection>
          <EuiPageContentHeaderSection>
            <EuiFlexGroup>
              <EuiFlexItem>
                <EuiButton>Actions</EuiButton>
              </EuiFlexItem>
              <EuiFlexItem>
                <EuiButton fill>Create role</EuiButton>
              </EuiFlexItem>
            </EuiFlexGroup>
          </EuiPageContentHeaderSection>
        </EuiPageContentHeader>
        <EuiPageBody>
          <EuiInMemoryTable
            loading={roleData === [] && !errorFlag}
            columns={columns}
            items={roleData}
            itemId={'role_name'}
            pagination={true}
            search={true}
            error={errorFlag ? "Load data failed, please check console log for more detail." : ""}
          />
        </EuiPageBody>
      </EuiPageContent>
    </>
  );
}
