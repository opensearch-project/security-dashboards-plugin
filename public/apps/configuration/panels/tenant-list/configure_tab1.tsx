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
  EuiBadge,
  EuiButton,
  EuiButtonEmpty,
  EuiFlexGroup,
  EuiFlexItem,
  EuiInMemoryTable,
  EuiLink,
  EuiPageBody,
  EuiPageContent,
  EuiPageContentHeader,
  EuiPageContentHeaderSection,
  EuiPageHeader,
  EuiText,
  EuiTitle,
  EuiGlobalToastList,
  EuiSwitch,
  Query,
  EuiHorizontalRule,
  EuiFormRow,
  EuiDescribedFormGroup,
  EuiSpacer,
  EuiCheckbox,
  EuiModal,
  EuiModalHeader,
  EuiModalHeaderTitle,
  EuiModalBody,
  EuiModalFooter,
  EuiCodeBlock,
  EuiCallOut,
  EuiBottomBar,
  EuiComboBox,
  EuiIcon,
  EuiPanel,
} from '@elastic/eui';
import { ChangeEvent } from 'react';
import React, { ReactNode, useState, useCallback } from 'react';
import { SaveChangesModalGenerator } from './save_changes_modal';
import { AppDependencies } from '../../../types';
import { displayBoolean } from '../../utils/display-utils';
import { updateAuditLogging } from '../../utils/audit-logging-utils';
import { AuditLoggingSettings } from '../audit-logging/types';
import { AuthInfo } from '../../../../types';
import { updateTenancyConfig } from '../../utils/tenancy-config_util';
import { TenancyConfigSettings } from '../tenancy-config/types';
import { getAuthInfo } from '../../../../utils/auth-info-utils';
import {
  fetchTenants,
  transformTenantData,
  updateTenancyConfiguration,
  updateTenant,
} from '../../utils/tenant-utils';
import { Action, Tenant } from '../../types';
import { showTableStatusMessage } from '../../utils/loading-spinner-utils';
import { useContextMenuState } from '../../utils/context-menu';
import { TenantEditModal } from './edit-modal';
import {
  createTenancyErrorToast,
  createTenancySuccessToast,
  createUnknownErrorToast,
  getSuccessToastMessage,
  useToastState,
} from '../../utils/toast-utils';
import { getDashboardsInfo } from '../../../../utils/dashboards-info-utils';

export function ConfigureTab1(props: AppDependencies) {
  const [isMultiTenancyEnabled, setIsMultiTenancyEnabled] = useState(false);
  const [isPrivateTenantEnabled, setIsPrivateTenantEnabled] = useState(false);
  const [dashboardsDefaultTenant, setDashboardsDefaultTenant] = useState(false);

  const [originalConfiguration, setOriginalConfiguration] = React.useState<TenancyConfigSettings>({
    multitenancy_enabled: isMultiTenancyEnabled,
    private_tenant_enabled: isPrivateTenantEnabled,
    default_tenant: dashboardsDefaultTenant,
  });

  const [updatedConfiguration, setUpdatedConfiguration] = React.useState<TenancyConfigSettings>({
    multitenancy_enabled: isMultiTenancyEnabled,
    private_tenant_enabled: isPrivateTenantEnabled,
    default_tenant: dashboardsDefaultTenant,
  });

  const [showErrorWarning, setShowErrorWarning] = React.useState(false);

  const [changeInMultiTenancyOption, setChangeInMultiTenancyOption] = useState(0);
  const [changeInPrivateTenantOption, setChangeInPrivateTenantOption] = useState(0);
  const [changeInDefaultTenantOption, setChangeInDefaultTenantOption] = useState(0);

  const [toasts, addToast, removeToast] = useToastState();
  const [selectedComboBoxOptions, setSelectedComboBoxOptions] = useState();

  const discardChangesFunction = async () => {
    await setUpdatedConfiguration(originalConfiguration);
    setSelectedComboBoxOptions();
    await setChangeInMultiTenancyOption(0);
    await setChangeInPrivateTenantOption(0);
    await setChangeInDefaultTenantOption(0);
  };

  const [saveChangesModal, setSaveChangesModal] = useState<ReactNode>(null);

  const showSaveChangesModal = (
    originalConfigurationPassed: TenancyConfigSettings,
    updatedConfigurationPassed: TenancyConfigSettings
  ) => {
    setSaveChangesModal(
      <SaveChangesModalGenerator
        originalTenancyConfig={originalConfigurationPassed}
        updatedTenancyConfig={updatedConfigurationPassed}
        handleClose={() => setSaveChangesModal(null)}
        handleSave={async (updatedConfiguration1: TenancyConfigSettings) => {
          try {
            console.log('Calling API');
            await updateTenancyConfiguration(props.coreStart.http, updatedConfiguration1);
            setSaveChangesModal(null);
            setChangeInMultiTenancyOption(0);
            setChangeInPrivateTenantOption(0);
            setChangeInDefaultTenantOption(0);
            setOriginalConfiguration(updatedConfiguration1);
            setSelectedComboBoxOptions();
            addToast(
              createTenancySuccessToast(
                'savePassed',
                'Tenancy changes applied',
                'Tenancy changes applied.'
              )
            );
          } catch (e) {
            console.log(e);
            setSaveChangesModal(null);
            setChangeInMultiTenancyOption(0);
            setChangeInPrivateTenantOption(0);
            setChangeInDefaultTenantOption(0);
            setSelectedComboBoxOptions();
            setUpdatedConfiguration(originalConfigurationPassed);
            addToast(createTenancyErrorToast('saveFailed', 'Changes not applied', e.message));
          }
          setSaveChangesModal(null);
        }}
      />
    );
  };

  let bottomBar;
  if (changeInMultiTenancyOption + changeInPrivateTenantOption + changeInDefaultTenantOption > 0) {
    bottomBar = (
      <EuiBottomBar>
        <EuiFlexGroup justifyContent="spaceBetween">
          <EuiFlexItem grow={false}>
            <EuiFlexGroup gutterSize="s">
              {/* <EuiFlexItem grow={false}>*/}
              {/* </EuiFlexItem>*/}
              <EuiFlexItem grow={false}>
                <EuiText>
                  {changeInMultiTenancyOption +
                    changeInPrivateTenantOption +
                    changeInDefaultTenantOption}{' '}
                  Unsaved change(s)
                </EuiText>
              </EuiFlexItem>
            </EuiFlexGroup>
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiFlexGroup gutterSize="s">
              <EuiFlexItem grow={false}>
                <EuiButton color="#FFF" size="s" onClick={() => discardChangesFunction()}>
                  Discard changes
                </EuiButton>
              </EuiFlexItem>
              <EuiFlexItem grow={false}>
                <EuiButton
                  color="primary"
                  fill
                  size="s"
                  onClick={() => showSaveChangesModal(originalConfiguration, updatedConfiguration)}
                >
                  Save Changes
                </EuiButton>
              </EuiFlexItem>
            </EuiFlexGroup>
          </EuiFlexItem>
        </EuiFlexGroup>
      </EuiBottomBar>
    );
  }
  const [tenantData, setTenantData] = React.useState<Tenant[]>([]);

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        await setOriginalConfiguration({
          multitenancy_enabled: (await getDashboardsInfo(props.coreStart.http))
            .multitenancy_enabled,
          private_tenant_enabled: (await getDashboardsInfo(props.coreStart.http))
            .private_tenant_enabled,
          default_tenant: (await getDashboardsInfo(props.coreStart.http)).default_tenant,
        });

        await setUpdatedConfiguration({
          multitenancy_enabled: (await getDashboardsInfo(props.coreStart.http))
            .multitenancy_enabled,
          private_tenant_enabled: (await getDashboardsInfo(props.coreStart.http))
            .private_tenant_enabled,
          default_tenant: (await getDashboardsInfo(props.coreStart.http)).default_tenant,
        });

        const rawTenantData = await fetchTenants(props.coreStart.http);
        const processedTenantData = transformTenantData(rawTenantData);
        setTenantData(processedTenantData);
      } catch (e) {
        // TODO: switch to better error display.
        console.error(e);
      }
    };
    fetchData();
  }, [props.coreStart.http, props.tenant]);

  const onSwitchChangeTenancyEnabled = async () => {
    try {
      await setUpdatedConfiguration({
        multitenancy_enabled: !updatedConfiguration.multitenancy_enabled,
        private_tenant_enabled: updatedConfiguration.private_tenant_enabled,
        default_tenant: updatedConfiguration.default_tenant,
      });

      if (
        originalConfiguration.multitenancy_enabled === updatedConfiguration.multitenancy_enabled
      ) {
        await setChangeInMultiTenancyOption(1);
      } else {
        await setChangeInMultiTenancyOption(0);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const onSwitchChangePrivateTenantEnabled = async () => {
    try {
      await setUpdatedConfiguration({
        multitenancy_enabled: updatedConfiguration.multitenancy_enabled,
        private_tenant_enabled: !updatedConfiguration.private_tenant_enabled,
        default_tenant: updatedConfiguration.default_tenant,
      });

      if (
        originalConfiguration.private_tenant_enabled === updatedConfiguration.private_tenant_enabled
      ) {
        await setChangeInPrivateTenantOption(1);
      } else {
        await setChangeInPrivateTenantOption(0);
      }
      if (
        updatedConfiguration.default_tenant === 'Private' &&
        updatedConfiguration.private_tenant_enabled
      ) {
        await setShowErrorWarning(true);
      } else {
        await setShowErrorWarning(false);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const updateDefaultTenant = async (newDefaultTenant: string) => {
    try {
      await setUpdatedConfiguration({
        multitenancy_enabled: updatedConfiguration.multitenancy_enabled,
        private_tenant_enabled: updatedConfiguration.private_tenant_enabled,
        default_tenant: newDefaultTenant,
      });
      if (originalConfiguration.default_tenant === updatedConfiguration.default_tenant) {
        await setChangeInDefaultTenantOption(1);
      } else {
        await setChangeInDefaultTenantOption(0);
      }
      if (
        updatedConfiguration.default_tenant === 'Private' &&
        !updatedConfiguration.private_tenant_enabled
      ) {
        await setShowErrorWarning(true);
      } else {
        await setShowErrorWarning(false);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const comboBoxOptions = [];

  for (const tenant in tenantData) {
    if (tenantData[tenant].tenant) {
      comboBoxOptions.push({
        label: tenantData[tenant].tenant,
      });
    }
  }

  const onChangeComboBoxOptions = (selectedComboBoxOptionsAfterChange) => {
    setSelectedComboBoxOptions(selectedComboBoxOptionsAfterChange);
    if (selectedComboBoxOptionsAfterChange.length > 0) {
      updateDefaultTenant(selectedComboBoxOptionsAfterChange[0].label);
    }
  };

  const errorCallOut = (
    <EuiCallOut title="Address the highlighted areas" color="danger" iconType="iInCircle">
      <p>
        <EuiIcon type="dot" size={'s'} /> The private tenant is disabled. Select another default
        tenant.
      </p>
    </EuiCallOut>
  );
  const errorMessage = (
    <EuiText color={'danger'}>
      The private tenant is disabled. Select another default tenant.
    </EuiText>
  );
  return (
    <>
      <EuiPageHeader />
      <EuiCallOut
        title="Caution: Changes to configurations can have an impact on user access."
        color="warning"
        iconType="iInCircle"
      >
        <p>
          Making changes to these configurations may remove users’ access to objects and other work
          in their tenants and alter the Dashboards user interface accordingly. Keep this in mind
          before applying changes to configurations.
        </p>
      </EuiCallOut>
      <EuiSpacer size="m" />
      {showErrorWarning && errorCallOut}
      {!showErrorWarning && bottomBar}
      <EuiSpacer size="l" />

      <EuiPageContent>
        <EuiPageContentHeader>
          <EuiPageContentHeaderSection>
            <EuiTitle size="l">
              <h3>Multi-tenancy</h3>
            </EuiTitle>
            <EuiHorizontalRule />

            <EuiDescribedFormGroup
              title={<h4>Tenancy</h4>}
              description={
                <p4>
                  {' '}
                  Selecting multi-tenancy allows you to create tenants and save OpenSearch
                  Dashboards objects, such as index patterns and visualizations. Tenants are useful
                  for safely sharing your work with other Dashboards users.
                </p4>
              }
              className="described-form-group1"
            >
              <EuiCheckbox
                id="EnableMultitenancyCheckBox"
                label={'Enabled'}
                checked={updatedConfiguration.multitenancy_enabled}
                onChange={() => onSwitchChangeTenancyEnabled()}
              />
            </EuiDescribedFormGroup>
          </EuiPageContentHeaderSection>
        </EuiPageContentHeader>
      </EuiPageContent>
      <EuiSpacer size="l" />

      <EuiPageContent>
        <EuiPageContentHeader>
          <EuiPageContentHeaderSection>
            <EuiTitle size="l">
              <h3>Tenants</h3>
            </EuiTitle>
            <EuiHorizontalRule />
            <EuiDescribedFormGroup
              title={<h4>Global Tenant</h4>}
              description={
                <p4>
                  {' '}
                  Global tenant is shared amaong all Dashboards users and cannot be disabled.{' '}
                </p4>
              }
              className="described-form-group2"
            >
              <EuiText>
                <p>
                  <small>Global Tenant: Enabled</small>
                </p>
              </EuiText>
            </EuiDescribedFormGroup>
            <EuiDescribedFormGroup
              title={<h4>Private Tenant</h4>}
              description={
                <p4>
                  Private tenant is exclusive to each user and keeps a user&apos;s personal objects
                  private. When using the private tenant, it does not allow access to objects
                  created by the user&apos;s global tenant.
                </p4>
              }
              className="described-form-group3"
            >
              <EuiCheckbox
                id="EnablePrivateTenantCheckBox"
                label={'Enable'}
                checked={updatedConfiguration.private_tenant_enabled}
                onChange={() => onSwitchChangePrivateTenantEnabled()}
                disabled={!updatedConfiguration.multitenancy_enabled}
              />
            </EuiDescribedFormGroup>
          </EuiPageContentHeaderSection>
        </EuiPageContentHeader>
      </EuiPageContent>
      {saveChangesModal}
      <EuiSpacer size="l" />
      <EuiPageContent>
        <EuiPageContentHeader>
          <EuiPageContentHeaderSection>
            <EuiTitle size="l">
              <h3>Default tenant</h3>
            </EuiTitle>
            <EuiHorizontalRule />
            <EuiDescribedFormGroup
              title={<h4>Default Tenant</h4>}
              description={
                <p4>
                  {' '}
                  This option allows you to select the default tenant when logging into
                  Dashboards/Kibana for the first time. You can choose from any of the available
                  tenants.{' '}
                </p4>
              }
              className="described-form-group4"
            >
              <EuiFlexGroup>
                <EuiFlexItem>
                  <EuiComboBox
                    placeholder={updatedConfiguration.default_tenant}
                    options={comboBoxOptions}
                    selectedOptions={selectedComboBoxOptions}
                    onChange={onChangeComboBoxOptions}
                    singleSelection={{ asPlainText: true }}
                    isClearable={true}
                    isInvalid={showErrorWarning}
                    data-test-subj="demoComboBox"
                    isDisabled={!updatedConfiguration.multitenancy_enabled}
                  />

                  {showErrorWarning && errorMessage}
                </EuiFlexItem>
              </EuiFlexGroup>
            </EuiDescribedFormGroup>
          </EuiPageContentHeaderSection>
        </EuiPageContentHeader>
        <EuiGlobalToastList toasts={toasts} toastLifeTimeMs={3000} dismissToast={removeToast} />
      </EuiPageContent>
    </>
  );
}
