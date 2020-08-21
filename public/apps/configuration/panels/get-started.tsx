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

import {
  EuiButton,
  EuiPageHeader,
  EuiText,
  EuiTitle,
  EuiSteps,
  EuiCode,
  EuiSpacer,
  EuiImage,
  EuiFlexItem,
  EuiFlexGroup,
  EuiLink,
  EuiPanel,
} from '@elastic/eui';
import React from 'react';
import { AppDependencies } from '../../types';
import securityStepsDiagram from '../../../assets/get_started.svg';
import { buildHashUrl } from '../utils/url-builder';
import { Action, ResourceType } from '../types';
import { DocLinks } from '../constants';

const setOfSteps = [
  {
    title: 'Add backends',
    children: (
      <>
        <EuiText size="s" color="subdued">
          Add authentication<EuiCode>(authc)</EuiCode>and authorization<EuiCode>(authz)</EuiCode>
          information to<EuiCode>plugins/opendistro_security/securityconfig/config.yml</EuiCode>.
          The <EuiCode>authc</EuiCode> section contains the backends to check user credentials
          against. The <EuiCode>authz</EuiCode>
          section contains any backends to fetch external identities from. The most common example
          of an external identity is an LDAP group.{' '}
          <EuiLink external={true} href={DocLinks.AuthenticationFlowDoc} target="_blank">
            Learn More
          </EuiLink>
        </EuiText>

        <EuiSpacer size="m" />

        <EuiFlexGroup gutterSize="s">
          <EuiFlexItem grow={false}>
            <EuiButton
              fill
              iconType="popout"
              iconSide="right"
              href={DocLinks.BackendConfigurationDoc}
              target="_blank"
            >
              Create config.yml
            </EuiButton>
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiButton
              onClick={() => {
                window.location.href = buildHashUrl(ResourceType.auth);
              }}
            >
              Review authentication and authorization
            </EuiButton>
          </EuiFlexItem>
        </EuiFlexGroup>

        <EuiSpacer size="l" />
      </>
    ),
  },
  {
    title: 'Create roles',
    children: (
      <>
        <EuiText size="s" color="subdued">
          Roles are reusable collections of permissions. The default roles are a great starting
          point, but you might need to create custom roles that meet your exact needs.{' '}
          <EuiLink external={true} href={DocLinks.CreateRolesDoc} target="_blank">
            Learn More
          </EuiLink>
        </EuiText>

        <EuiSpacer size="m" />

        <EuiFlexGroup gutterSize="s">
          <EuiFlexItem grow={false}>
            <EuiButton
              fill
              onClick={() => {
                window.location.href = buildHashUrl(ResourceType.roles);
              }}
            >
              Explore existing roles
            </EuiButton>
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiButton
              onClick={() => {
                window.location.href = buildHashUrl(ResourceType.roles, Action.create);
              }}
            >
              Create new role
            </EuiButton>
          </EuiFlexItem>
        </EuiFlexGroup>

        <EuiSpacer size="l" />
      </>
    ),
  },
  {
    title: 'Map users',
    children: (
      <>
        <EuiText size="s" color="subdued">
          After a user successfully authenticates, the security plugin retrieves that user’s roles.
          You can map roles directly to users, but you can also map them to external identities.{' '}
          <EuiLink external={true} href={DocLinks.MapUsersToRolesDoc} target="_blank">
            Learn More
          </EuiLink>
        </EuiText>

        <EuiSpacer size="m" />

        <EuiFlexGroup gutterSize="s">
          <EuiFlexItem grow={false}>
            <EuiButton
              fill
              onClick={() => {
                window.location.href = buildHashUrl(ResourceType.users);
              }}
            >
              Map users to a role
            </EuiButton>
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiButton
              onClick={() => {
                window.location.href = buildHashUrl(ResourceType.users, Action.create);
              }}
            >
              Create internal user
            </EuiButton>
          </EuiFlexItem>
        </EuiFlexGroup>
      </>
    ),
  },
];

export function GetStarted(props: AppDependencies) {
  const panelMaxWidth = 850;
  return (
    <>
      <EuiPageHeader>
        <EuiTitle size="l">
          <h1>Get started</h1>
        </EuiTitle>
        <EuiButton iconType="popout" iconSide="right" href={buildHashUrl()} target="_blank">
          Open in new window
        </EuiButton>
      </EuiPageHeader>

      <EuiPanel paddingSize="l" style={{ maxWidth: panelMaxWidth }}>
        <EuiText size="s" color="subdued">
          <p>
            The Open Distro for Elasticsearch security plugin lets you define the API calls that
            users can make and the data they can access. The most basic configuration consists of
            three steps.
          </p>
        </EuiText>

        <EuiSpacer size="l" />

        <EuiImage size="xl" alt="Three steps to set up your security" url={securityStepsDiagram} />

        <EuiSpacer size="l" />

        <EuiSteps steps={setOfSteps} />
      </EuiPanel>

      <EuiSpacer size="l" />

      <EuiPanel paddingSize="l" style={{ maxWidth: panelMaxWidth }}>
        <EuiTitle size="s">
          <h3>Optional: Configure audit logs</h3>
        </EuiTitle>
        <EuiText size="s" color="subdued">
          <p>
            Audit logs let you track user access to your Elasticsearch cluster and are useful for
            compliance purposes. If you enable this feature, Amazon Elasticsearch Service publishes
            the audit logs to CloudWatch Logs, where you can monitor and search them.{' '}
            <EuiLink external={true} href={DocLinks.AuditLogsDoc} target="_blank">
              Learn More
            </EuiLink>
          </p>
          <EuiButton
            fill
            onClick={() => {
              window.location.href = buildHashUrl(ResourceType.auditLogging);
            }}
          >
            Configure Audit Logs
          </EuiButton>
        </EuiText>
      </EuiPanel>
    </>
  );
}
