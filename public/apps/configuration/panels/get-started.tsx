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
} from '@elastic/eui';
import React from 'react';
import { AppDependencies } from '../../types';
import securityStepsDiagram from '../../../assets/get_started.png';
import { buildHashUrl } from '../utils/url-builder';
import { Action, ResourceType } from '../types';

const setOfSteps = [
  {
    title: 'Secure your backends (authc & authz)',
    children: (
      <>
        <EuiText size="s" color="subdued" grow={false}>
          In order to use Security plugin, you must decide on authentication
          <EuiCode>authc</EuiCode> and authorization backends <EuiCode>authz</EuiCode>.<br />
          Use <EuiCode>plugins/opendistro_security/securityconfig/config.yml</EuiCode>
          to define how to retrieve and verify the user credentials, and how to fetch additional
          roles from backend system if needed.
        </EuiText>

        <EuiSpacer />

        <EuiFlexGroup gutterSize="s">
          <EuiFlexItem grow={false}>
            <EuiButton fill iconType="popout" iconSide="right">
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
      </>
    ),
  },
  {
    title: 'Find a role that satisfies your security needs',
    children: (
      <>
        <EuiText size="s" color="subdued" grow={false}>
          A role defines cluster permissions, index permissions, and read/write access to a tenant.
          <br />
          You can make use of a build-in role, or create a custom role based on your needs.{' '}
          <EuiLink external={true} href="/">
            Learn More
          </EuiLink>
        </EuiText>

        <EuiSpacer />

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
      </>
    ),
  },
  {
    title: 'Map internal users or external identities to your role',
    children: (
      <>
        <EuiText size="s" color="subdued" grow={false}>
          Map users to a role to uptake its role settings. You can build an internal user database
          within this plugin, or use a external entities to directly map to a role through an
          external authentication system.{' '}
          <EuiLink external={true} href="/">
            Learn More
          </EuiLink>
        </EuiText>

        <EuiSpacer />

        <EuiFlexGroup gutterSize="s">
          <EuiFlexItem grow={false}>
            <EuiButton fill>Map users to a role</EuiButton>
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
  return (
    <>
      <EuiPageHeader>
        <EuiTitle size="l">
          <h1>Get started</h1>
        </EuiTitle>
        <EuiButton iconType="popout" iconSide="right">
          Open in new window
        </EuiButton>
      </EuiPageHeader>

      <EuiText size="s" color="subdued" grow={false}>
        <p>
          Security allows you to design your own security roles and authenticate your users in
          flexible ways, regardless whether you have an external authentication system set up or
          not. Set up your security by following three steps:
        </p>
      </EuiText>

      <EuiSpacer size="l" />

      <EuiImage size="xl" alt="Three steps to set up your security" url={securityStepsDiagram} />

      <EuiSpacer size="l" />

      <EuiSteps steps={setOfSteps} />

      <EuiText size="s" color="subdued" grow={false}>
        <h3>Optional: Configure audit logs</h3>
        <p>
          Elasticsearch audit logs are records that provide documentary evidence of security
          activities in a given system. Audit logs let you track user access to your Elasticsearch
          cluster and are useful for compliance purposes or in the aftermath of a security breach.{' '}
          <EuiLink external={true} href="/">
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
    </>
  );
}
