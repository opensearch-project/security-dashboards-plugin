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
  Query,
} from '@elastic/eui';
import React, { ReactNode, useState, useCallback } from 'react';
import { difference } from 'lodash';
import { getCurrentUser } from '../../../../utils/auth-info-utils';
import { AppDependencies } from '../../../types';
import { Action, Tenant } from '../../types';
import { ExternalLink, renderCustomization, tableItemsUIProps } from '../../utils/display-utils';
import {
  fetchTenants,
  transformTenantData,
  fetchCurrentTenant,
  resolveTenantName,
  updateTenant,
  requestDeleteTenant,
  selectTenant,
} from '../../utils/tenant-utils';
import { getNavLinkById } from '../../../../services/chrome_wrapper';
import { TenantEditModal } from './edit-modal';
import {
  useToastState,
  createUnknownErrorToast,
  getSuccessToastMessage,
} from '../../utils/toast-utils';
import { PageId } from '../../types';
import { useDeleteConfirmState } from '../../utils/delete-confirm-modal-utils';
import { showTableStatusMessage } from '../../utils/loading-spinner-utils';
import { useContextMenuState } from '../../utils/context-menu';
import { generateResourceName } from '../../utils/resource-utils';
import { DocLinks } from '../../constants';
import { TenantInstructionView } from './tenant-instruction-view';

export function TenantList(props: AppDependencies) {
  const [tenantData, setTenantData] = React.useState<Tenant[]>([]);
  const [errorFlag, setErrorFlag] = React.useState(false);
  const [selection, setSelection] = React.useState<Tenant[]>([]);
  const [currentTenant, setCurrentTenant] = useState('');
  const [currentUsername, setCurrentUsername] = useState('');
  // Modal state
  const [editModal, setEditModal] = useState<ReactNode>(null);
  const [toasts, addToast, removeToast] = useToastState();
  const [loading, setLoading] = useState(false);

  const [query, setQuery] = useState<Query | null>(null);

  // Configuration
  const isPrivateEnabled = props.config.multitenancy.tenants.enable_private;

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const rawTenantData = await fetchTenants(props.coreStart.http);
      const processedTenantData = transformTenantData(rawTenantData, isPrivateEnabled);
      const activeTenant = await fetchCurrentTenant(props.coreStart.http);
      const currentUser = await getCurrentUser(props.coreStart.http);
      setCurrentUsername(currentUser);
      setCurrentTenant(resolveTenantName(activeTenant, currentUser));
      setTenantData(processedTenantData);
    } catch (e) {
      console.log(e);
      setErrorFlag(true);
    } finally {
      setLoading(false);
    }
  }, [isPrivateEnabled, props.coreStart.http]);

  React.useEffect(() => {
    fetchData();
  }, [props.coreStart.http, fetchData]);

  const handleDelete = async () => {
    const tenantsToDelete: string[] = selection.map((r) => r.tenant);
    try {
      await requestDeleteTenant(props.coreStart.http, tenantsToDelete);
      setTenantData(difference(tenantData, selection));
      setSelection([]);
    } catch (e) {
      console.log(e);
    } finally {
      closeActionsMenu();
    }
  };
  const [showDeleteConfirmModal, deleteConfirmModal] = useDeleteConfirmState(
    handleDelete,
    'tenant(s)'
  );

  const changeTenant = async (tenantValue: string) => {
    const selectedTenant = await selectTenant(props.coreStart.http, {
      tenant: tenantValue,
      username: currentUsername,
    });
    setCurrentTenant(resolveTenantName(selectedTenant, currentUsername));
  };

  const getTenantName = (tenantValue: string) => {
    return tenantData.find((tenant: Tenant) => tenant.tenantValue === tenantValue)?.tenant;
  };

  const switchToSelectedTenant = async (tenantValue: string, tenantName: string) => {
    try {
      await changeTenant(tenantValue);
      // refresh the page to let the page to reload app configs, like dark mode etc.
      // also refresh the tenant to ensure tenant is set correctly when sharing urls.
      window.location.reload();
    } catch (e) {
      console.log(e);
      addToast(createUnknownErrorToast('selectFailed', `select ${tenantName} tenant`));
    } finally {
      closeActionsMenu();
    }
  };

  const viewOrCreateDashboard = async (tenantValue: string, action: string) => {
    try {
      await changeTenant(tenantValue);
      window.location.href = getNavLinkById(props.coreStart, PageId.dashboardId);
    } catch (e) {
      console.log(e);
      addToast(
        createUnknownErrorToast(
          `${action}Dashboard`,
          `${action} dashboard for ${getTenantName(tenantValue)} tenant`
        )
      );
    }
  };

  const viewOrCreateVisualization = async (tenantValue: string, action: string) => {
    try {
      await changeTenant(tenantValue);
      window.location.href = getNavLinkById(props.coreStart, PageId.visualizationId);
    } catch (e) {
      console.log(e);
      addToast(
        createUnknownErrorToast(
          `${action}Visualization`,
          `${action} visualization for ${getTenantName(tenantValue)} tenant`
        )
      );
    }
  };

  const columns = [
    {
      field: 'tenant',
      name: 'Name',
      render: (tenantName: string) => (
        <>
          {tenantName}
          {tenantName === currentTenant && (
            <>
              &nbsp;
              <EuiBadge>Current</EuiBadge>
            </>
          )}
        </>
      ),
      sortable: true,
    },
    {
      field: 'description',
      name: 'Description',
      truncateText: true,
    },
    {
      field: 'tenantValue',
      name: 'Dashboard',
      render: (tenant: string) => (
        <>
          <EuiLink onClick={() => viewOrCreateDashboard(tenant, Action.view)}>
            View dashboard
          </EuiLink>
        </>
      ),
    },
    {
      field: 'tenantValue',
      name: 'Visualizations',
      render: (tenant: string) => (
        <>
          <EuiLink onClick={() => viewOrCreateVisualization(tenant, Action.view)}>
            View visualizations
          </EuiLink>
        </>
      ),
    },
    {
      field: 'reserved',
      name: 'Customization',
      render: (reserved: boolean) => {
        return renderCustomization(reserved, tableItemsUIProps);
      },
    },
  ];

  const actionsMenuItems = [
    <EuiButtonEmpty
      id="switchTenant"
      key="switchTenant"
      disabled={selection.length !== 1}
      onClick={() => switchToSelectedTenant(selection[0].tenantValue, selection[0].tenant)}
    >
      Switch to selected tenant
    </EuiButtonEmpty>,
    <EuiButtonEmpty
      id="edit"
      key="edit"
      disabled={selection.length !== 1 || selection[0].reserved}
      onClick={() => showEditModal(selection[0].tenant, Action.edit, selection[0].description)}
    >
      Edit
    </EuiButtonEmpty>,
    <EuiButtonEmpty
      id="duplicate"
      key="duplicate"
      disabled={selection.length !== 1}
      onClick={() =>
        showEditModal(
          generateResourceName(Action.duplicate, selection[0].tenant),
          Action.duplicate,
          selection[0].description
        )
      }
    >
      Duplicate
    </EuiButtonEmpty>,
    <EuiButtonEmpty
      id="createDashboard"
      key="createDashboard"
      disabled={selection.length !== 1}
      onClick={() => viewOrCreateDashboard(selection[0].tenantValue, Action.create)}
    >
      Create dashboard
    </EuiButtonEmpty>,
    <EuiButtonEmpty
      id="createVisualizations"
      key="createVisualizations"
      disabled={selection.length !== 1}
      onClick={() => viewOrCreateVisualization(selection[0].tenantValue, Action.create)}
    >
      Create visualizations
    </EuiButtonEmpty>,
    <EuiButtonEmpty
      id="delete"
      key="delete"
      color="danger"
      onClick={showDeleteConfirmModal}
      disabled={selection.length === 0 || selection.some((tenant) => tenant.reserved)}
    >
      Delete
    </EuiButtonEmpty>,
  ];

  const [actionsMenu, closeActionsMenu] = useContextMenuState('Actions', {}, actionsMenuItems);

  const showEditModal = (
    initialTenantName: string,
    action: Action,
    initialTenantDescription: string
  ) => {
    setEditModal(
      <TenantEditModal
        tenantName={initialTenantName}
        tenantDescription={initialTenantDescription}
        action={action}
        handleClose={() => setEditModal(null)}
        handleSave={async (tenantName: string, tenantDescription: string) => {
          try {
            await updateTenant(props.coreStart.http, tenantName, {
              description: tenantDescription,
            });
            setEditModal(null);
            fetchData();
            addToast({
              id: 'saveSucceeded',
              title: getSuccessToastMessage('Tenant', action, tenantName),
              color: 'success',
            });
          } catch (e) {
            console.log(e);
            addToast(createUnknownErrorToast('saveFailed', `save ${action} tenant`));
          }
        }}
      />
    );
  };

  if (!props.config.multitenancy.enabled) {
    return <TenantInstructionView />;
  }
  /* eslint-disable */
  return (
    <>
      <EuiPageHeader>
        <EuiTitle size="l">
          <h1>Tenants</h1>
        </EuiTitle>
      </EuiPageHeader>
      <EuiPageContent>
        <EuiPageContentHeader>
          <EuiPageContentHeaderSection>
            <EuiTitle size="s">
              <h3>
                Tenants
                <span className="panel-header-count">
                  {' '}
                  ({Query.execute(query || '', tenantData).length})
                </span>
              </h3>
            </EuiTitle>
            <EuiText size="xs" color="subdued">
              Tenants in OpenSearch Dashboards are spaces for saving index patterns, visualizations,
              dashboards, and other OpenSearch Dashboards objects. Use tenants to safely share your
              work with other OpenSearch Dashboards users. You can control which roles have access
              to a tenant and whether those roles have read or write access. The “Current” label
              indicates which tenant you are using now. Switch to another tenant anytime from your
              user profile, which is located on the top right of the screen. <ExternalLink href={DocLinks.TenantPermissionsDoc} />
            </EuiText>
          </EuiPageContentHeaderSection>
          <EuiPageContentHeaderSection>
            <EuiFlexGroup>
              <EuiFlexItem>{actionsMenu}</EuiFlexItem>
              <EuiFlexItem>
                <EuiButton
                  id="createTenant"
                  fill
                  onClick={() => showEditModal('', Action.create, '')}
                >
                  Create tenant
                </EuiButton>
              </EuiFlexItem>
            </EuiFlexGroup>
          </EuiPageContentHeaderSection>
        </EuiPageContentHeader>
        <EuiPageBody>
          <EuiInMemoryTable
            tableLayout={'auto'}
            loading={tenantData === [] && !errorFlag}
            columns={columns}
            // @ts-ignore
            items={tenantData}
            itemId={'tenant'}
            pagination
            search={{
              box: { placeholder: 'Find tenant' },
              onChange: (arg) => {
                setQuery(arg.query);
                return true;
              },
            }}
            // @ts-ignore
            selection={{ onSelectionChange: setSelection }}
            sorting
            error={errorFlag ? 'Load data failed, please check console log for more detail.' : ''}
            message={showTableStatusMessage(loading, tenantData)}
          />
        </EuiPageBody>
      </EuiPageContent>
      {editModal}
      {deleteConfirmModal}
      <EuiGlobalToastList toasts={toasts} toastLifeTimeMs={10000} dismissToast={removeToast} />
    </>
  );
}
