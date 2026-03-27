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
  EuiSmallButton,
  EuiFlexGroup,
  EuiFlexItem,
  EuiInMemoryTable,
  EuiLoadingContent,
  EuiPageBody,
  EuiPageContent,
  EuiPageContentHeader,
  EuiPageContentHeaderSection,
  EuiPageHeader,
  EuiText,
  EuiTitle,
  EuiToolTip,
  Query,
} from '@elastic/eui';
import React, { useCallback, useContext, useState } from 'react';
import { AppDependencies } from '../../types';
import { Action, ApiToken } from '../types';
import { ResourceType } from '../../../../common';
import { useDeleteConfirmState } from '../utils/delete-confirm-modal-utils';
import { tableItemsUIProps, truncatedListView } from '../utils/display-utils';
import { listApiTokens, requestRevokeApiTokens } from '../utils/api-token-utils';
import { showTableStatusMessage } from '../utils/loading-spinner-utils';
import { buildHashUrl } from '../utils/url-builder';
import { DataSourceContext } from '../app-router';
import { SecurityPluginTopNavMenu } from '../top-nav-menu';
import { AccessErrorComponent } from '../access-error-component';
import { PageHeader } from '../header/header-components';

function formatDate(epochMillis: number): string {
  return new Date(epochMillis).toLocaleString();
}

function getStatusBadge(token: ApiToken) {
  if (token.revoked_at) {
    return (
      <EuiToolTip content={`Revoked on ${formatDate(token.revoked_at)}`}>
        <EuiBadge color="danger">Revoked</EuiBadge>
      </EuiToolTip>
    );
  }
  if (token.expiration && token.iat + token.expiration < Date.now()) {
    return <EuiBadge color="warning">Expired</EuiBadge>;
  }
  return <EuiBadge color="success">Active</EuiBadge>;
}

function getColumns() {
  return [
    {
      field: 'name',
      name: 'Name',
      sortable: true,
    },
    {
      field: 'id',
      name: 'Status',
      render: (_id: string, token: ApiToken) => getStatusBadge(token),
      sortable: false,
    },
    {
      field: 'cluster_permissions',
      name: 'Cluster permissions',
      render: truncatedListView(tableItemsUIProps),
      truncateText: true,
    },
    {
      field: 'index_permissions',
      name: 'Index permissions',
      render: (indexPerms: ApiToken['index_permissions']) => {
        if (!indexPerms || indexPerms.length === 0) {
          return '-';
        }
        const patterns = indexPerms.flatMap((p) => p.index_pattern);
        return truncatedListView(tableItemsUIProps)(patterns);
      },
      truncateText: true,
    },
    {
      field: 'created_by',
      name: 'Created by',
      sortable: true,
      render: (createdBy?: string) => createdBy || '-',
    },
    {
      field: 'iat',
      name: 'Created',
      render: (iat: number) => formatDate(iat),
      sortable: true,
    },
    {
      field: 'revoked_at',
      name: 'Revoked at',
      render: (revokedAt?: number) => (revokedAt ? formatDate(revokedAt) : '-'),
      sortable: true,
    },
  ];
}

export function ApiTokenList(props: AppDependencies) {
  const [tokenData, setTokenData] = React.useState<ApiToken[]>([]);
  const [errorFlag, setErrorFlag] = React.useState(false);
  const [accessErrorFlag, setAccessErrorFlag] = React.useState(false);
  const [selection, setSelection] = React.useState<ApiToken[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState<Query | null>(null);
  const { dataSource, setDataSource } = useContext(DataSourceContext)!;

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const tokens = await listApiTokens(props.coreStart.http, dataSource.id);
      setTokenData(tokens);
      setErrorFlag(false);
      setAccessErrorFlag(false);
    } catch (e) {
      console.log(e);
      if (e.response && [400, 403].includes(e.response.status)) {
        setAccessErrorFlag(true);
      }
      setErrorFlag(true);
    } finally {
      setLoading(false);
    }
  }, [props.coreStart.http, dataSource]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRevoke = async () => {
    const tokensToRevoke = selection.filter((t) => !t.revoked_at).map((t) => t.id);
    try {
      await requestRevokeApiTokens(props.coreStart.http, tokensToRevoke, dataSource.id);
      await fetchData();
      setSelection([]);
    } catch (e) {
      console.log(e);
    }
  };

  const [showRevokeConfirmModal, revokeConfirmModal] = useDeleteConfirmState(
    handleRevoke,
    'API key(s)',
    <EuiText size="s">
      <p>
        Do you really want to revoke the selected API key(s)? Revoked keys will no longer be
        usable for authentication.
      </p>
    </EuiText>
  );

  const activeSelection = selection.filter((t) => !t.revoked_at);

  const useUpdatedUX = props.coreStart.uiSettings.get('home:useNewHomePage');
  const buttonData = [
    {
      label: 'Create API key',
      isLoading: false,
      href: buildHashUrl(ResourceType.apiTokens, Action.create),
      fill: true,
      iconType: 'plus',
      iconSide: 'left',
      type: 'button',
      testId: 'create-api-key',
    },
  ];
  const descriptionData = [
    {
      isLoading: loading,
      renderComponent: (
        <EuiText size="xs" color="subdued">
          API keys allow security admins to issue scoped, long-lived keys with permissions
          attached directly to the key. Keys authenticate via the{' '}
          <code>Authorization: ApiKey</code> header.
        </EuiText>
      ),
    },
  ];

  const tokenLen = Query.execute(query || '', tokenData).length;
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
        descriptionControls={descriptionData}
        appRightControls={buttonData}
        fallBackComponent={
          <EuiPageHeader>
            <EuiText size="s">
              <h1>API Keys</h1>
            </EuiText>
          </EuiPageHeader>
        }
        resourceType={ResourceType.apiTokens}
        count={tokenData.length}
      />
      {loading ? (
        <EuiLoadingContent />
      ) : accessErrorFlag ? (
        <AccessErrorComponent loading={loading} dataSourceLabel={dataSource && dataSource.label} />
      ) : (
        <EuiPageContent>
          {useUpdatedUX ? null : (
            <EuiPageContentHeader>
              <EuiPageContentHeaderSection>
                <EuiTitle size="s">
                  <h3>
                    API Keys
                    <span className="panel-header-count"> ({tokenLen})</span>
                  </h3>
                </EuiTitle>
                <EuiText size="xs" color="subdued">
                  API keys allow security admins to issue scoped, long-lived keys with
                  permissions attached directly to the key. Keys authenticate via the{' '}
                  <code>Authorization: ApiKey</code> header.
                </EuiText>
              </EuiPageContentHeaderSection>
              <EuiPageContentHeaderSection>
                <EuiFlexGroup>
                  <EuiFlexItem>
                    <EuiSmallButton
                      color="danger"
                      onClick={showRevokeConfirmModal}
                      disabled={activeSelection.length === 0}
                      data-test-subj="revoke-api-keys"
                    >
                      Revoke
                    </EuiSmallButton>
                  </EuiFlexItem>
                  <EuiFlexItem>
                    <EuiSmallButton
                      fill
                      href={buildHashUrl(ResourceType.apiTokens, Action.create)}
                      data-test-subj="create-api-key"
                    >
                      Create API key
                    </EuiSmallButton>
                  </EuiFlexItem>
                </EuiFlexGroup>
              </EuiPageContentHeaderSection>
            </EuiPageContentHeader>
          )}
          <EuiPageBody>
            <EuiInMemoryTable
              tableLayout={'auto'}
              loading={tokenData === [] && !errorFlag}
              columns={getColumns()}
              items={tokenData}
              itemId={'id'}
              pagination
              search={{
                box: { placeholder: 'Search API keys' },
                onChange: (arg) => {
                  setQuery(arg.query);
                  return true;
                },
                toolsRight: useUpdatedUX
                  ? [
                      <EuiFlexItem>
                        <EuiSmallButton
                          color="danger"
                          onClick={showRevokeConfirmModal}
                          disabled={activeSelection.length === 0}
                        >
                          Revoke
                        </EuiSmallButton>
                      </EuiFlexItem>,
                    ]
                  : undefined,
              }}
              selection={{ onSelectionChange: setSelection }}
              sorting
              error={errorFlag ? 'Load data failed, please check console log for more detail.' : ''}
              message={showTableStatusMessage(loading, tokenData)}
            />
          </EuiPageBody>
          {revokeConfirmModal}
        </EuiPageContent>
      )}
    </>
  );
}
