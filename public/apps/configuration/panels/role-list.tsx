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
import {
  EuiPageHeader,
  EuiTitle,
  EuiPageContent,
  EuiPageContentHeader,
  EuiPageContentHeaderSection,
  EuiFlexItem,
  EuiText,
  EuiLink,
  EuiFlexGroup,
  EuiButton,
} from '@elastic/eui';

export function RoleList() {
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
      </EuiPageContent>
    </>
  );
}
