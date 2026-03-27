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
  EuiSmallButton,
  EuiCallOut,
  EuiCodeBlock,
  EuiFlexGroup,
  EuiFlexItem,
  EuiForm,
  EuiGlobalToastList,
  EuiPageHeader,
  EuiSpacer,
  EuiText,
  EuiCompressedFieldNumber,
  EuiCompressedSuperSelect,
} from '@elastic/eui';
import React, { useState, useContext } from 'react';
import { AppDependencies } from '../../types';
import { CLUSTER_PERMISSIONS, INDEX_PERMISSIONS } from '../constants';
import { fetchActionGroups } from '../utils/action-groups-utils';
import { comboBoxOptionToString, stringToComboBoxOption } from '../utils/combo-box-utils';
import { PanelWithHeader } from '../utils/panel-with-header';
import { ClusterPermissionPanel } from './role-edit/cluster-permission-panel';
import {
  IndexPermissionPanel,
  unbuildIndexPermissionState,
} from './role-edit/index-permission-panel';
import { RoleIndexPermissionStateClass } from './role-edit/types';
import { buildHashUrl } from '../utils/url-builder';
import { ComboBoxOptions } from '../types';
import { ResourceType } from '../../../../common';
import { useToastState, createUnknownErrorToast, createSuccessToast } from '../utils/toast-utils';
import { FormRow } from '../utils/form-row';
import { NameRow } from '../utils/name-row';
import { DataSourceContext } from '../app-router';
import { SecurityPluginTopNavMenu } from '../top-nav-menu';
import { PageHeader } from '../header/header-components';
import { createApiToken } from '../utils/api-token-utils';

const EXPIRATION_OPTIONS = [
  { value: 'never', inputDisplay: 'No expiration' },
  { value: '30', inputDisplay: '30 days' },
  { value: '60', inputDisplay: '60 days' },
  { value: '90', inputDisplay: '90 days' },
  { value: 'custom', inputDisplay: 'Custom (days)' },
];

function getExpirationMs(expirationPreset: string, customDays: string): number | undefined {
  if (expirationPreset === 'never') return undefined;
  const days = expirationPreset === 'custom' ? parseInt(customDays, 10) : parseInt(expirationPreset, 10);
  if (!days || days <= 0) return undefined;
  return days * 24 * 60 * 60 * 1000;
}

export function ApiTokenCreate(props: AppDependencies) {
  const [tokenName, setTokenName] = useState('');
  const [clusterPermissions, setClusterPermissions] = useState<ComboBoxOptions>([]);
  const [indexPermissions, setIndexPermissions] = useState<RoleIndexPermissionStateClass[]>([]);
  const [expirationPreset, setExpirationPreset] = useState<string>('never');
  const [customDays, setCustomDays] = useState<string>('');
  const [toasts, addToast, removeToast] = useToastState();
  const [isFormValid, setIsFormValid] = useState<boolean>(true);
  const [createdToken, setCreatedToken] = useState<string | null>(null);

  const [actionGroups, setActionGroups] = useState<ComboBoxOptions>([]);

  const dataSourceEnabled = !!props.depsStart.dataSource?.dataSourceEnabled;
  const { dataSource, setDataSource } = useContext(DataSourceContext)!;

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const actionGroupsData = await fetchActionGroups(props.coreStart.http, dataSource.id);
        setActionGroups(
          Object.entries(actionGroupsData).map(([key]) => stringToComboBoxOption(key))
        );
      } catch (e) {
        console.log(e);
      }
    };
    fetchData();
  }, [props.coreStart.http, dataSource]);

  const clusterPermissionOptions = [
    ...CLUSTER_PERMISSIONS.map(stringToComboBoxOption),
    ...actionGroups,
  ];

  const indexPermissionOptions = [
    ...INDEX_PERMISSIONS.map(stringToComboBoxOption),
    ...actionGroups,
  ];

  const handleCreate = async () => {
    if (!tokenName) {
      setIsFormValid(false);
      return;
    }

    try {
      // Build index permissions from the role-edit panel state, mapping to the API token format
      const builtIndexPerms = unbuildIndexPermissionState(indexPermissions);
      const apiTokenIndexPerms = builtIndexPerms
        .filter((p) => p.index_patterns.length > 0)
        .map((p) => ({
          index_pattern: p.index_patterns,
          allowed_actions: p.allowed_actions,
        }));

      const requestBody: any = {
        name: tokenName,
        cluster_permissions: clusterPermissions.map(comboBoxOptionToString),
        index_permissions: apiTokenIndexPerms,
      };

      const expirationMs = getExpirationMs(expirationPreset, customDays);
      if (expirationMs) {
        requestBody.expiration = expirationMs;
      }

      const result = await createApiToken(props.coreStart.http, requestBody, dataSource.id);
      setCreatedToken(result.token);
      addToast(
        createSuccessToast(
          'api-token-create-success',
          'API key created',
          `Key "${tokenName}" was created successfully. Copy the key now — it will not be shown again.`
        )
      );
    } catch (e) {
      console.log(e);
      addToast(createUnknownErrorToast('api-token-create-error', 'create API key'));
    }
  };

  const useUpdatedUX = props.coreStart.uiSettings.get('home:useNewHomePage');

  return (
    <>
      <SecurityPluginTopNavMenu
        {...props}
        dataSourcePickerReadOnly={false}
        setDataSource={setDataSource}
        selectedDataSource={dataSource}
      />
      <PageHeader
        navigation={props.depsStart.navigation}
        coreStart={props.coreStart}
        fallBackComponent={
          <EuiPageHeader>
            <EuiText size="s">
              <h1>Create API Key</h1>
            </EuiText>
          </EuiPageHeader>
        }
        resourceType={ResourceType.apiTokens}
        pageTitle="Create API Key"
      />
      <EuiSpacer size="m" />

      {createdToken && (
        <>
          <EuiCallOut title="API key created" color="success" iconType="check">
            <p>
              Copy this key now. It will not be shown again. Use it in the{' '}
              <code>Authorization: ApiKey {'<token>'}</code> header.
            </p>
            <EuiCodeBlock language="text" isCopyable paddingSize="s">
              {createdToken}
            </EuiCodeBlock>
          </EuiCallOut>
          <EuiSpacer size="l" />
          <EuiSmallButton href={buildHashUrl(ResourceType.apiTokens)}>
            Back to API Keys
          </EuiSmallButton>
          <EuiSpacer size="l" />
        </>
      )}

      {!createdToken && (
        <EuiForm isInvalid={!isFormValid}>
          <PanelWithHeader
            headerText="Token details"
            headerSubText="Provide a name and optional expiration for this API key."
          >
            <NameRow
              headerText="Token name"
              headerSubText="Specify a descriptive and unique name for this API key. The name must not be empty."
              resourceName={tokenName}
              resourceType="token"
              action="create"
              setNameState={setTokenName}
              setIsFormValid={setIsFormValid}
            />
            <FormRow
              headerText="Expiration"
              headerSubText="Choose how long this API key should remain valid."
              optional
            >
              <div>
                <EuiCompressedSuperSelect
                  options={EXPIRATION_OPTIONS}
                  valueOfSelected={expirationPreset}
                  onChange={setExpirationPreset}
                  data-test-subj="api-key-expiration-select"
                />
                {expirationPreset === 'custom' && (
                  <>
                    <EuiSpacer size="s" />
                    <EuiCompressedFieldNumber
                      placeholder="Number of days"
                      value={customDays}
                      onChange={(e) => setCustomDays(e.target.value)}
                      min={1}
                      append="days"
                      data-test-subj="api-key-custom-expiration"
                    />
                  </>
                )}
              </div>
            </FormRow>
          </PanelWithHeader>

          <EuiSpacer size="m" />

          <ClusterPermissionPanel
            state={clusterPermissions}
            optionUniverse={clusterPermissionOptions}
            setState={setClusterPermissions}
          />

          <EuiSpacer size="m" />

          <IndexPermissionPanel
            state={indexPermissions}
            optionUniverse={indexPermissionOptions}
            setState={setIndexPermissions}
            showAdvancedSecurityOptions={false}
          />

          <EuiSpacer size="m" />

          <EuiFlexGroup justifyContent="flexEnd">
            <EuiFlexItem grow={false}>
              <EuiSmallButton href={buildHashUrl(ResourceType.apiTokens)}>Cancel</EuiSmallButton>
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <EuiSmallButton fill onClick={handleCreate} data-test-subj="create-api-token-submit">
                Create
              </EuiSmallButton>
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiForm>
      )}

      <EuiGlobalToastList toasts={toasts} toastLifeTimeMs={10000} dismissToast={removeToast} />
    </>
  );
}
