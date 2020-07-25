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

import React, { Fragment, useState, useEffect } from 'react';

import {
  EuiButton,
  EuiPageContentHeader,
  EuiPageContentHeaderSection,
  EuiSpacer,
  EuiTabbedContent,
  EuiTitle,
  EuiPageContent,
  EuiText,
  EuiLink,
  EuiFlexGroup,
  EuiFlexItem,
  EuiPageBody,
  EuiInMemoryTable,
  EuiEmptyPrompt,
} from '@elastic/eui';
import { BreadcrumbsPageDependencies } from '../../../types';
import { buildHashUrl } from '../../utils/url-builder';
import { ResourceType, Action } from '../../types';
import { getRoleMappingData, MappedUsersListing } from '../../utils/role-mapping-utils';

interface RoleViewProps extends BreadcrumbsPageDependencies {
  roleName: string;
}

const mappedUserColumns = [
  {
    field: 'userType',
    name: 'User type',
    sortable: true,
  },
  {
    field: 'userName',
    name: 'User',
    sortable: true,
    truncateText: true,
  },
];

export function RoleView(props: RoleViewProps) {
  const duplicateRoleLink = buildHashUrl(ResourceType.roles, Action.duplicate, props.roleName);

  const [mappedUsers, setMappedUsers] = useState<MappedUsersListing[]>([]);
  const [errorFlag, setErrorFlag] = useState(false);
  const [selection, setSelection] = useState<MappedUsersListing[]>([]);
  const message = (
    <EuiEmptyPrompt
      title={<h2>No user has been mapped to this role</h2>}
      titleSize="s"
      body={
        <EuiText size="s" color="subdued" grow={false}>
          <p>You can map internal users or external identities to this role</p>
        </EuiText>
      }
      actions={
        <EuiFlexGroup gutterSize="s">
          <EuiFlexItem grow={false}>
            <EuiButton
              iconType="popout"
              iconSide="right"
              onClick={() => {
                window.location.href = buildHashUrl(ResourceType.users, Action.create);
              }}
            >
              Create internal user
            </EuiButton>
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiButton fill>Map users</EuiButton>
          </EuiFlexItem>
        </EuiFlexGroup>
      }
    />
  );

  useEffect(() => {
    const fetchData = async () => {
      try {
        const roleMappingData = await getRoleMappingData(props.coreStart.http, props.roleName);
        setMappedUsers(roleMappingData);
      } catch (e) {
        console.log(e);
        setErrorFlag(true);
      }
    };

    fetchData();
  }, [props.coreStart.http, props.roleName]);

  const tabs = [
    {
      id: 'permissions',
      name: 'Permissions',
      disabled: false,
      content: <Fragment>Permission working in progress</Fragment>,
    },
    {
      id: 'users',
      name: 'Mapped users',
      disabled: false,
      content: (
        <>
          <EuiSpacer />
          <EuiPageContent>
            <EuiPageContentHeader>
              <EuiPageContentHeaderSection>
                <EuiTitle size="s">
                  <h3>Mapped users ({mappedUsers.length})</h3>
                </EuiTitle>
                <EuiText size="xs" color="subdued">
                  You can map two types of users: 1. Internal users within the Security plugin. An
                  internal user can have its own backend role and host for an external
                  authentication and authorization. 2. External identity, which directly maps to
                  roles through an external authentication system.{' '}
                  <EuiLink external={true} href="/">
                    Learn More
                  </EuiLink>
                </EuiText>
              </EuiPageContentHeaderSection>
              <EuiPageContentHeaderSection>
                <EuiFlexGroup>
                  <EuiFlexItem>
                    <EuiButton isDisabled>Delete mapping</EuiButton>
                  </EuiFlexItem>
                  <EuiFlexItem>
                    <EuiButton>Manage mapping</EuiButton>
                  </EuiFlexItem>
                </EuiFlexGroup>
              </EuiPageContentHeaderSection>
            </EuiPageContentHeader>
            <EuiPageBody>
              <EuiInMemoryTable
                loading={mappedUsers === [] && !errorFlag}
                columns={mappedUserColumns}
                items={mappedUsers}
                itemId={'userName'}
                pagination={true}
                message={message}
                selection={{ onSelectionChange: setSelection }}
                sorting={true}
                error={
                  errorFlag ? 'Load data failed, please check console log for more detail.' : ''
                }
              />
            </EuiPageBody>
          </EuiPageContent>
        </>
      ),
    },
  ];

  return (
    <>
      {props.buildBreadcrumbs(props.roleName)}

      <EuiPageContentHeader>
        <EuiPageContentHeaderSection>
          <EuiTitle size="l">
            <h1>{props.roleName}</h1>
          </EuiTitle>
        </EuiPageContentHeaderSection>

        <EuiPageContentHeaderSection>
          <EuiButton href={duplicateRoleLink}>Duplicate role</EuiButton>
        </EuiPageContentHeaderSection>
      </EuiPageContentHeader>

      <EuiTabbedContent tabs={tabs} />

      <EuiSpacer />
    </>
  );
}
