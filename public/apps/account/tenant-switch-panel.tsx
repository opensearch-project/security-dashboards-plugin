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
  EuiButton,
  EuiButtonEmpty,
  EuiCallOut,
  EuiComboBox,
  EuiComboBoxOptionOption,
  EuiModal,
  EuiModalBody,
  EuiModalFooter,
  EuiOverlayMask,
  EuiRadioGroup,
  EuiSpacer,
  EuiText,
  EuiTitle,
} from '@elastic/eui';
import { CoreStart } from 'opensearch-dashboards/public';
import { keys } from 'lodash';
import React, { useState } from 'react';
import { ClientConfigType } from '../../types';
import {
  RESOLVED_GLOBAL_TENANT,
  RESOLVED_PRIVATE_TENANT,
  resolveTenantName,
  selectTenant,
} from '../configuration/utils/tenant-utils';
import { fetchAccountInfo } from './utils';
import { constructErrorMessageAndLog } from '../error-utils';
import { getSavedTenant, setSavedTenant } from '../../utils/storage-utils';
import { getDashboardsInfo } from '../../utils/dashboards-info-utils';

interface TenantSwitchPanelProps {
  coreStart: CoreStart;
  handleClose: () => void;
  handleSwitchAndClose: () => void;
  config: ClientConfigType;
  tenant: string;
}

const GLOBAL_TENANT_KEY_NAME = 'global_tenant';
export const GLOBAL_TENANT_RADIO_ID = 'global';
export const PRIVATE_TENANT_RADIO_ID = 'private';
export const CUSTOM_TENANT_RADIO_ID = 'custom';

export function TenantSwitchPanel(props: TenantSwitchPanelProps) {
  const [tenants, setTenants] = React.useState<string[]>([]);
  const [username, setUsername] = React.useState<string>('');
  const [roles, setRoles] = React.useState<string[]>([]);
  const [errorCallOut, setErrorCallOut] = React.useState<string>('');
  const [tenantSwitchRadioIdSelected, setTenantSwitchRadioIdSelected] = React.useState<string>();
  const [selectedCustomTenantOption, setSelectedCustomTenantOption] = React.useState<
    EuiComboBoxOptionOption[]
  >([]);
  const [isPrivateEnabled, setIsPrivateEnabled] = useState(
    props.config.multitenancy.tenants.enable_private
  );
  const [isMultiTenancyEnabled, setIsMultiTenancyEnabled] = useState(true);

  const setCurrentTenant = (currentRawTenantName: string, currentUserName: string) => {
    const resolvedTenantName = resolveTenantName(currentRawTenantName, currentUserName);

    if (resolvedTenantName === RESOLVED_GLOBAL_TENANT) {
      setTenantSwitchRadioIdSelected(GLOBAL_TENANT_RADIO_ID);
    } else if (resolvedTenantName === RESOLVED_PRIVATE_TENANT) {
      setTenantSwitchRadioIdSelected(PRIVATE_TENANT_RADIO_ID);
    } else {
      setTenantSwitchRadioIdSelected(CUSTOM_TENANT_RADIO_ID);
      setSelectedCustomTenantOption([{ label: resolvedTenantName }]);
    }
  };

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const accountInfo = await fetchAccountInfo(props.coreStart.http);
        setRoles(accountInfo.data.roles);
        const dashboardsInfo = await getDashboardsInfo(props.coreStart.http);
        setIsMultiTenancyEnabled(dashboardsInfo.multitenancy_enabled);
        setIsPrivateEnabled(dashboardsInfo.private_tenant_enabled);
        const tenantsInfo = accountInfo.data.tenants || {};
        setTenants(keys(tenantsInfo));

        const currentUserName = accountInfo.data.user_name;
        setUsername(currentUserName);

        let currentRawTenantName: string | undefined;
        if (props.config.multitenancy.enable_aggregation_view) {
          currentRawTenantName = props.tenant;
        } else {
          currentRawTenantName = accountInfo.data.user_requested_tenant;
        }
        setCurrentTenant(currentRawTenantName || '', currentUserName);
      } catch (e) {
        // TODO: switch to better error display.
        console.error(e);
      }
    };

    fetchData();
  }, [props.coreStart.http, props.tenant, props.config.multitenancy]);

  // Custom tenant super select related.
  const onCustomTenantChange = (selectedOption: EuiComboBoxOptionOption[]) => {
    setSelectedCustomTenantOption(selectedOption);
    setTenantSwitchRadioIdSelected(CUSTOM_TENANT_RADIO_ID);
    setErrorCallOut('');
  };
  const customTenantOptions = tenants
    .filter((tenant) => {
      return tenant !== GLOBAL_TENANT_KEY_NAME && tenant !== username;
    })
    .sort()
    .map((option: string) => ({
      label: option,
    }));

  const DEFAULT_READONLY_ROLES = ['kibana_read_only'];
  const readonly = roles.some(
    (role) =>
      props.config.readonly_mode?.roles.includes(role) || DEFAULT_READONLY_ROLES.includes(role)
  );
  const isGlobalEnabled = props.config.multitenancy.tenants.enable_global;
  const shouldDisableGlobal = !isGlobalEnabled || !tenants.includes(GLOBAL_TENANT_KEY_NAME);
  const getGlobalDisabledInstruction = () => {
    if (!isGlobalEnabled) {
      return 'Contact the administrator to enable global tenant.';
    }

    if (!tenants.includes(GLOBAL_TENANT_KEY_NAME)) {
      return 'Contact the administrator to get access to global tenant.';
    }
  };

  // The key for private tenant is the user name.
  const shouldDisablePrivate = !isPrivateEnabled || !tenants.includes(username) || readonly;
  const getPrivateDisabledInstruction = () => {
    if (!isPrivateEnabled) {
      return 'Contact the administrator to enable private tenant.';
    }

    if (!tenants.includes(username)) {
      return 'Contact the administrator to get access to private tenant.';
    }

    if (readonly) {
      return 'Your account has read-only privileges only, using the private tenant is not possible.';
    }
  };

  // Tenant switch radios related.
  const tenantSwitchRadios = [
    {
      id: GLOBAL_TENANT_RADIO_ID,
      label: (
        <>
          Global
          <EuiText size="s">
            The global tenant is shared between every OpenSearch Dashboards user.
          </EuiText>
          {shouldDisableGlobal && <i>{getGlobalDisabledInstruction()}</i>}
          <EuiSpacer />
        </>
      ),
      disabled: shouldDisableGlobal,
    },
    {
      id: PRIVATE_TENANT_RADIO_ID,
      label: (
        <>
          Private
          <EuiText size="s">
            The private tenant is exclusive to each user and can&apos;t be shared. You might use the
            private tenant for exploratory work.
          </EuiText>
          {shouldDisablePrivate && <i>{getPrivateDisabledInstruction()}</i>}
          <EuiSpacer />
        </>
      ),
      disabled: shouldDisablePrivate,
    },
    {
      id: CUSTOM_TENANT_RADIO_ID,
      label: <>Choose from custom</>,
      disabled: customTenantOptions.length === 0,
    },
  ];

  const onTenantSwitchRadioChange = (radioId: string) => {
    setTenantSwitchRadioIdSelected(radioId);
    setErrorCallOut('');
  };

  const changeTenant = async (tenantName: string) => {
    await selectTenant(props.coreStart.http, {
      tenant: tenantName,
      username,
    });
  };

  const handleTenantConfirmation = async function () {
    let tenantName;

    if (tenantSwitchRadioIdSelected === GLOBAL_TENANT_RADIO_ID) {
      tenantName = '';
    } else if (tenantSwitchRadioIdSelected === PRIVATE_TENANT_RADIO_ID) {
      tenantName = '__user__';
    } else if (tenantSwitchRadioIdSelected === CUSTOM_TENANT_RADIO_ID) {
      if (selectedCustomTenantOption) {
        tenantName = selectedCustomTenantOption[0].label;
      }
    }

    // check tenant name before calling backend
    if (tenantName === undefined) {
      setErrorCallOut('No target tenant is specified!');
    } else {
      try {
        setSavedTenant(tenantName);

        await changeTenant(tenantName);
        props.handleSwitchAndClose();
      } catch (e) {
        setErrorCallOut(constructErrorMessageAndLog(e, 'Failed to switch tenant.'));
      }
    }
  };

  const invalidCustomTenant =
    tenantSwitchRadioIdSelected === CUSTOM_TENANT_RADIO_ID && !selectedCustomTenantOption[0];

  let content;

  if (isMultiTenancyEnabled) {
    content = (
      <>
        <EuiRadioGroup
          data-test-subj="tenant-switch-radios"
          options={tenantSwitchRadios}
          idSelected={tenantSwitchRadioIdSelected}
          onChange={(radioId) => onTenantSwitchRadioChange(radioId)}
          name="tenantSwitchRadios"
        />

        {/* This combo box has to be outside the radio group.
          In current EUI if put into the child of radio option, clicking in the combo box will not
          show the drop down list since the radio option consumes the click event. */}
        <EuiComboBox
          placeholder="Select a custom tenant"
          options={customTenantOptions}
          singleSelection={{ asPlainText: true }}
          selectedOptions={selectedCustomTenantOption}
          onChange={onCustomTenantChange}
          // For vertical alignment with the radio option.
          style={{ marginLeft: '24px' }}
        />

        <EuiSpacer />

        {errorCallOut && (
          <EuiCallOut color="danger" iconType="alert">
            {errorCallOut}
          </EuiCallOut>
        )}
      </>
    );
  } else {
    content = <>Contact the administrator to enable multi tenancy.</>;
  }

  return (
    <EuiOverlayMask>
      <EuiModal data-test-subj="tenant-switch-modal" onClose={props.handleClose}>
        <EuiSpacer />
        <EuiModalBody>
          <EuiTitle>
            <h4>Select your tenant</h4>
          </EuiTitle>

          <EuiSpacer />

          <EuiText size="s" color="subdued">
            Tenants are useful for safely sharing your work with other OpenSearch Dashboards users.
            You can switch your tenant anytime by clicking the user avatar on top right.
          </EuiText>

          <EuiSpacer />

          {content}

          <EuiSpacer />
        </EuiModalBody>
        <EuiModalFooter>
          <EuiButtonEmpty onClick={props.handleClose}>Cancel</EuiButtonEmpty>

          <EuiButton
            data-test-subj="confirm"
            fill={isMultiTenancyEnabled && !invalidCustomTenant}
            disabled={!isMultiTenancyEnabled || invalidCustomTenant}
            onClick={handleTenantConfirmation}
          >
            Confirm
          </EuiButton>
        </EuiModalFooter>
      </EuiModal>
    </EuiOverlayMask>
  );
}
