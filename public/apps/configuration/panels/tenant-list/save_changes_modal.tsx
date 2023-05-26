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

import {
  EuiPageContentHeader,
  EuiHorizontalRule,
  EuiCheckbox,
  EuiConfirmModal,
} from '@elastic/eui';
import React from 'react';
import { ExternalLink } from '../../utils/display-utils';
import { TenancyConfigSettings } from '../tenancy-config/types';
import { DocLinks } from '../../constants';

interface SaveChangesModalDeps {
  originalTenancyConfig: TenancyConfigSettings;
  updatedTenancyConfig: TenancyConfigSettings;
  handleClose: () => void;
  handleSave: (updatedTenancyConfig: TenancyConfigSettings) => Promise<void>;
}

export function SaveChangesModalGenerator(props: SaveChangesModalDeps) {
  let globalDefaultModal;
  const [tenancyChecked, setTenancyChecked] = React.useState(false);
  const [privateTenancyChecked, setPrivateTenancyChecked] = React.useState(false);
  const [defaultTenantChecked, setDefaultTenantChecked] = React.useState(false);
  if (
    props.originalTenancyConfig.default_tenant !== props.updatedTenancyConfig.default_tenant &&
    props.originalTenancyConfig.multitenancy_enabled ===
      props.updatedTenancyConfig.multitenancy_enabled &&
    props.originalTenancyConfig.private_tenant_enabled ===
      props.updatedTenancyConfig.private_tenant_enabled
  ) {
    globalDefaultModal = (
      <EuiConfirmModal
        style={{ width: 600 }}
        title="Change default tenant?"
        onCancel={props.handleClose}
        onConfirm={async () => {
          await props.handleSave(props.updatedTenancyConfig);
        }}
        cancelButtonText="Discard Changes"
        confirmButtonText="Change Default Tenant"
        defaultFocusedButton="confirm"
      >
        <p>
          Users will load into {props.updatedTenancyConfig.default_tenant} tenant when they log into
          Dashboards if they have the appropriate permissions. If users don’t have permissions to a
          custom tenant they will load into the global tenant.{' '}
          <ExternalLink href={DocLinks.MultiTenancyDoc} />
        </p>
      </EuiConfirmModal>
    );
    return globalDefaultModal;
  }

  let tenancyToggled = false;
  let privateTenantToggled = false;
  let defaultTenantChanged = false;
  let tenancyChangeCheckbox;
  let privateTenancyChangeCheckbox;
  let defaultTenantChangeCheckbox;
  let tenancyChangeMessage = 'Message 1';
  let privateTenancyChangeMessage = 'Message 2';
  let defaultTenantChangeMessage = 'Message 3';

  if (
    props.updatedTenancyConfig.multitenancy_enabled !==
    props.originalTenancyConfig.multitenancy_enabled
  ) {
    tenancyToggled = true;
    if (props.updatedTenancyConfig.multitenancy_enabled) {
      tenancyChangeMessage =
        'Enable Tenancy - Users will be able to make use of the Tenancy Feature ' +
        'in OpenSearch Dashboards and switch between tenants they have access to.';
    } else {
      tenancyChangeMessage =
        "Disabling Tenancy - Users won't be able to access index patterns, visualizations, " +
        'dashboards, and other OpenSearch Dashboards objects saved in tenants other than the ' +
        'global tenant.';
    }
    tenancyChangeCheckbox = (
      <EuiCheckbox
        id={'tenancyChangeCheckbox'}
        label={tenancyChangeMessage}
        checked={tenancyChecked}
        onChange={() => setTenancyChecked(!tenancyChecked)}
      />
    );
  }

  if (
    props.updatedTenancyConfig.private_tenant_enabled !==
      props.originalTenancyConfig.private_tenant_enabled &&
    props.updatedTenancyConfig.multitenancy_enabled
  ) {
    privateTenantToggled = true;
    if (props.updatedTenancyConfig.private_tenant_enabled) {
      privateTenancyChangeMessage =
        'Enable private tenant - Users will be able to create index patterns, visualizations, and ' +
        'other OpenSearch Dashboards objects in a private tenant that they only have access to.';
    } else {
      privateTenancyChangeMessage =
        "Disabling private tenant - Users won't be able to access index patterns, visualizations, and " +
        'other OpenSearch Dashboards saved in their private tenant.';
    }
    privateTenancyChangeCheckbox = (
      <EuiCheckbox
        id={'privateTenancyChangeCheckbox'}
        label={privateTenancyChangeMessage}
        checked={privateTenancyChecked}
        onChange={() => setPrivateTenancyChecked(!privateTenancyChecked)}
      />
    );
  }

  if (
    props.updatedTenancyConfig.default_tenant !== props.originalTenancyConfig.default_tenant &&
    props.updatedTenancyConfig.multitenancy_enabled
  ) {
    defaultTenantChanged = true;
    defaultTenantChangeMessage =
      'Users will load into ' +
      props.updatedTenancyConfig.default_tenant +
      ' tenant when they log into Dashboards ' +
      'if they have the appropriate permissions. If users don’t have permissions to a custom ' +
      'tenant they will load into the global tenant.';
    defaultTenantChangeCheckbox = (
      <EuiCheckbox
        id={'defaultTenantChangeCheckbox'}
        label={defaultTenantChangeMessage}
        checked={defaultTenantChecked}
        onChange={() => setDefaultTenantChecked(!defaultTenantChecked)}
      />
    );
  }

  globalDefaultModal = (
    <EuiConfirmModal
      // onClose={props.handleClose}
      style={{ width: 600 }}
      title="Make changes to tenancy?"
      onCancel={props.handleClose}
      onConfirm={async () => {
        await props.handleSave(props.updatedTenancyConfig);
      }}
      cancelButtonText="Cancel"
      confirmButtonText="Apply changes"
      defaultFocusedButton="confirm"
      buttonColor={'danger'}
      confirmButtonDisabled={
        !(
          tenancyToggled === tenancyChecked &&
          privateTenantToggled === privateTenancyChecked &&
          defaultTenantChanged === defaultTenantChecked
        )
      }
    >
      <p>
        The changes you are about to make can break large portions of OpenSearch Dashboards. You
        might be able to revert some of these changes.{' '}
        <ExternalLink href={DocLinks.MultiTenancyDoc} />
      </p>

      <EuiHorizontalRule />

      <EuiPageContentHeader>
        <h4>Review changes and check the boxes below:</h4>
      </EuiPageContentHeader>
      {tenancyChangeCheckbox}
      {privateTenancyChangeCheckbox}
      {defaultTenantChangeCheckbox}
    </EuiConfirmModal>
  );

  return globalDefaultModal;
}
