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

export function ApiTokenCreate(props: AppDependencies) {
  const [tokenName, setTokenName] = useState('');
  const [clusterPermissions, setClusterPermissions] = useState<ComboBoxOptions>([]);
  const [indexPermissions, setIndexPermissions] = useState<RoleIndexPermissionStateClass[]>([]);
  const [expiration, setExpiration] = useState<string>('');
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

      if (expiration && parseInt(expiration, 10) > 0) {
        requestBody.expiration = parseInt(expiration, 10);
      }

      const result = await createApiToken(props.coreStart.http, requestBody, dataSource.id);
      setCreatedToken(result.token);
      addToast(
        createSuccessToast(
          'api-token-create-success',
          'API token created',
          `Token "${tokenName}" was created successfully. Copy the token now — it will not be shown again.`
        )
      );
    } catch (e) {
      console.log(e);
      addToast(createUnknownErrorToast('api-token-create-error', 'create API token'));
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
              <h1>Create API Token</h1>
            </EuiText>
          </EuiPageHeader>
        }
        resourceType={ResourceType.apiTokens}
        pageTitle="Create API Token"
      />
      <EuiSpacer size="m" />

      {createdToken && (
        <>
          <EuiCallOut title="API token created" color="success" iconType="check">
            <p>
              Copy this token now. It will not be shown again. Use it in the{' '}
              <code>Authorization: ApiKey {'<token>'}</code> header.
            </p>
            <EuiCodeBlock language="text" isCopyable paddingSize="s">
              {createdToken}
            </EuiCodeBlock>
          </EuiCallOut>
          <EuiSpacer size="l" />
          <EuiSmallButton href={buildHashUrl(ResourceType.apiTokens)}>
            Back to API Tokens
          </EuiSmallButton>
          <EuiSpacer size="l" />
        </>
      )}

      {!createdToken && (
        <EuiForm isInvalid={!isFormValid}>
          <PanelWithHeader
            headerText="Token details"
            headerSubText="Provide a name and optional expiration for this API token."
          >
            <NameRow
              headerText="Token name"
              headerSubText="Specify a descriptive and unique name for this API token. The name must not be empty."
              resourceName={tokenName}
              resourceType="token"
              action="create"
              setNameState={setTokenName}
              setIsFormValid={setIsFormValid}
            />
            <FormRow
              headerText="Expiration (milliseconds)"
              headerSubText="Optional. Time in milliseconds until the token expires. Leave empty for no expiration."
              optional
            >
              <EuiCompressedFieldNumber
                placeholder="e.g. 86400000 for 24 hours"
                value={expiration}
                onChange={(e) => setExpiration(e.target.value)}
                min={0}
              />
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
