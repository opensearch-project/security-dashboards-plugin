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
  EuiFacetButton,
  EuiIcon,
  EuiConfirmModal,
  EuiCallOut,
} from '@elastic/eui';
import React, { ReactNode, useState, useCallback } from 'react';
import { difference } from 'lodash';
import { HashRouter as Router, Route } from 'react-router-dom';
import { flow } from 'lodash';
import { TenancyConfigSettings } from '../tenancy-config/types';
import { getCurrentUser } from '../../../../utils/auth-info-utils';
import { AppDependencies } from '../../../types';
import { Action, ResourceType, Tenant } from '../../types';
import { ExternalLink, renderCustomization, tableItemsUIProps } from '../../utils/display-utils';
import {
  fetchTenants,
  transformTenantData,
  fetchCurrentTenant,
  resolveTenantName,
  updateTenant,
  requestDeleteTenant,
  selectTenant,
  updateTenancyConfiguration,
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
import { TenantList } from './tenant-list';
import { getBreadcrumbs, Route_MAP } from '../../app-router';
import { buildUrl } from '../../utils/url-builder';
import { CrossPageToast } from '../../cross-page-toast';
import { getDashboardsInfo } from '../../../../utils/dashboards-info-utils';

export function ManageTab(props: AppDependencies) {
  const setGlobalBreadcrumbs = flow(getBreadcrumbs, props.coreStart.chrome.setBreadcrumbs);
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

  const [isMultiTenancyEnabled, setIsMultiTenancyEnabled] = useState(false);
  const [isPrivateTenantEnabled, setIsPrivateTenantEnabled] = useState(false);
  const [dashboardsDefaultTenant, setDashboardsDefaultTenant] = useState('');

  const { http } = props.coreStart;

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const rawTenantData = await fetchTenants(http);
      const processedTenantData = transformTenantData(rawTenantData);
      const activeTenant = await fetchCurrentTenant(http);
      const currentUser = await getCurrentUser(http);
      setCurrentUsername(currentUser);
      setCurrentTenant(resolveTenantName(activeTenant, currentUser));
      setTenantData(processedTenantData);
      const tenancyConfig = await getDashboardsInfo(http);
      setIsMultiTenancyEnabled(tenancyConfig.multitenancy_enabled);
      setIsPrivateTenantEnabled(tenancyConfig.private_tenant_enabled);
      setDashboardsDefaultTenant(tenancyConfig.default_tenant);
    } catch (e) {
      console.log(e);
      setErrorFlag(true);
    } finally {
      setLoading(false);
    }
  }, [http]);

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

  const [isModalVisible, setIsModalVisible] = useState(false);

  const closeModal = () => setIsModalVisible(false);
  const showModal = () => setIsModalVisible(true);

  const setSelectedTenantAsGlobalDefaultAPICall = async (tenantName: string) => {
    try {
      await updateTenancyConfiguration(props.coreStart.http, {
        multitenancy_enabled: isMultiTenancyEnabled,
        private_tenant_enabled: isPrivateTenantEnabled,
        default_tenant: tenantName,
      });
      window.location.reload();
    } catch (e) {
      console.log(e);
      addToast(createUnknownErrorToast('selectFailed', `select ${tenantName} tenant`));
    } finally {
      closeModal();
      closeActionsMenu();
    }
  };

  let defaultTenantModal;
  if (isModalVisible && isMultiTenancyEnabled) {
    defaultTenantModal = (
      <EuiConfirmModal
        style={{ width: 600 }}
        title="Change default tenant?"
        onCancel={closeModal}
        onConfirm={() => setSelectedTenantAsGlobalDefaultAPICall(selection[0].tenant)}
        cancelButtonText="Discard Changes"
        confirmButtonText="Change Default Tenant"
        defaultFocusedButton="confirm"
      >
        <p>
          Users will load into {selection[0].tenant} tenant when they log into Dashboards if they
          have the appropriate permissions. If users don’t have permissions to a custom tenant they
          will load into the global tenant. <ExternalLink href={DocLinks.MultiTenancyDoc} />
        </p>
      </EuiConfirmModal>
    );
  }

  const renderConfigurePage = async () => {
    return (
      <Router basename={props.params.appBasePath}>
        <Route
          path={buildUrl(ResourceType.tenants)}
          render={() => {
            setGlobalBreadcrumbs(ResourceType.tenants);
            return <TenantList tabID={'Configure'} {...props} />;
          }}
        />
        <CrossPageToast />
      </Router>
    );
  };

  let tenancyDisabledWarning;
  if (!true) {
    tenancyDisabledWarning = (
      <EuiCallOut title="Tenancy is disabled" color="warning" iconType="iInCircle">
        <p>
          Tenancy is currently disabled and users don&apos;t have access to this feature. To create,
          edit tenants you must enabled tenanc throught he configure tenancy page.
        </p>
        <EuiButton
          id="switchToConfigure"
          color="warning"
          onClick={() => renderConfigurePage().then()}
        >
          Configure tenancy
        </EuiButton>
      </EuiCallOut>
    );
  }

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

  function loadTenantStatus(tenantName: string) {
    if (tenantName === 'Global') {
      if (
        !isMultiTenancyEnabled ||
        tenantName === dashboardsDefaultTenant ||
        (dashboardsDefaultTenant === 'Private' && !isPrivateTenantEnabled) ||
        dashboardsDefaultTenant === ''
      ) {
        return (
          <EuiFacetButton icon={<EuiIcon type="dot" color="primary" />}>
            Default Tenant
          </EuiFacetButton>
        );
      }
      return <EuiFacetButton icon={<EuiIcon type="dot" color="success" />}>Enabled</EuiFacetButton>;
    }

    if (tenantName === 'Private') {
      if (isPrivateTenantEnabled && isMultiTenancyEnabled) {
        if (tenantName === dashboardsDefaultTenant) {
          return (
            <EuiFacetButton icon={<EuiIcon type="dot" color="primary" />}>
              Default Tenant
            </EuiFacetButton>
          );
        }

        return (
          <EuiFacetButton icon={<EuiIcon type="dot" color="success" />}>Enabled</EuiFacetButton>
        );
      }
      return (
        <EuiFacetButton icon={<EuiIcon type="dot" color="#DDDDDD" />}>Disabled</EuiFacetButton>
      );
    }

    if (isMultiTenancyEnabled) {
      if (tenantName === dashboardsDefaultTenant) {
        return (
          <EuiFacetButton icon={<EuiIcon type="dot" color="primary" />}>
            Default Tenant
          </EuiFacetButton>
        );
      }
      return <EuiFacetButton icon={<EuiIcon type="dot" color="success" />}>Enabled</EuiFacetButton>;
    }

    return <EuiFacetButton icon={<EuiIcon type="dot" color="#DDDDDD" />}>Disabled</EuiFacetButton>;
  }

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
      field: 'tenant',
      name: 'Status',
      render: (tenantName: string) => <>{loadTenantStatus(tenantName)}</>,
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
      id="set as Global Default"
      key="Set as Global Default key"
      disabled={selection.length !== 1 || !isMultiTenancyEnabled}
      onClick={showModal}
    >
      Set as Default Tenant
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

  /* eslint-disable */
  return (
    <>
      {/*{tenancyDisabledWarning}*/}
      <EuiPageHeader>
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
            <EuiText size="s" color="subdued">
              Manage tenants that already have been created. Global tenant is the default when
              tenancy is turned off.
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
        {defaultTenantModal}
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
