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
  EuiBadge,
  EuiButton,
  EuiContextMenuItem,
  EuiContextMenuPanel,
  EuiFlexGroup,
  EuiFlexItem,
  EuiInMemoryTable,
  EuiLink,
  EuiPageBody,
  EuiPageContent,
  EuiPageContentHeader,
  EuiPageContentHeaderSection,
  EuiPageHeader,
  EuiPopover,
  EuiText,
  EuiTitle,
  EuiGlobalToastList,
  EuiOverlayMask,
  EuiConfirmModal,
} from '@elastic/eui';
import React, { ReactNode, useEffect, useState, useCallback } from 'react';
import { difference } from 'lodash';
import { getAuthInfo } from '../../../../utils/auth-info-utils';
import { AppDependencies } from '../../../types';
import { Action, Tenant } from '../../types';
import { renderCustomization } from '../../utils/display-utils';
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
import { useToastState } from '../../utils/toast-utils';

const PAGEID_DICT: { [key: string]: string } = {
  DashboardId: 'dashboards',
  VisualizationId: 'visualize',
};

export function TenantList(props: AppDependencies) {
  const [tenantData, setTenantData] = useState<Tenant[]>([]);
  const [errorFlag, setErrorFlag] = useState(false);
  const [selection, setSelection] = useState<Tenant[]>([]);
  const [isActionsPopoverOpen, setActionsPopoverOpen] = useState(false);
  const [currentTenant, setCurrentTenant] = useState('');
  const [currentUsername, setCurrentUsername] = useState('');
  // Modal state
  const [editModal, setEditModal] = useState<ReactNode>(null);
  const [toasts, addToast, removeToast] = useToastState();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const closeModal = () => setIsModalVisible(false);
  const showModal = () => setIsModalVisible(true);

  const fetchData = useCallback(async () => {
    try {
      const rawTenantData = await fetchTenants(props.coreStart.http);
      const processedTenantData = transformTenantData(rawTenantData);
      const activeTenant = await fetchCurrentTenant(props.coreStart.http);
      setCurrentTenant(resolveTenantName(activeTenant, currentUsername));
      setTenantData(processedTenantData);
    } catch (e) {
      console.log(e);
      setErrorFlag(true);
    }
  }, [currentUsername, props.coreStart.http]);

  useEffect(() => {
    const fetchCurrentUser = async () => {
      setCurrentUsername((await getAuthInfo(props.coreStart.http)).user_name);
    };
    fetchCurrentUser();
    fetchData();
  }, [props.coreStart.http, fetchData]);

  const handleDelete = async () => {
    const tenantsToDelete: string[] = selection.map((r) => r.tenant);
    try {
      await requestDeleteTenant(props.coreStart.http, tenantsToDelete);
      setTenantData(difference(tenantData, selection));
      setSelection([]);
      closeModal();
    } catch (e) {
      console.log(e);
    } finally {
      setActionsPopoverOpen(false);
    }
  };

  const handleTenantSelection = async (tenantname: string, redirectPageId: string) => {
    try {
      const selectedTenant = await selectTenant(props.coreStart.http, {
        tenant: tenantname,
        username: currentUsername,
      });
      setCurrentTenant(resolveTenantName(selectedTenant, currentUsername));
      setSelection([]);
      if (redirectPageId) {
        window.location.href = getNavLinkById(props.coreStart, redirectPageId);
      } else {
        addToast({
          id: 'selectSucceeded',
          title: `Selected tenant is now ${tenantname}`,
          color: 'success',
        });
      }
    } catch (e) {
      console.log(e);
      addToast({
        id: 'selectFailed',
        title: `Failed to selet ${tenantname} tenant. You may refresh the page to retry or see browser console for more information.`,
        color: 'danger',
      });
    } finally {
      setActionsPopoverOpen(false);
    }
  };

  const columns = [
    {
      field: 'tenant',
      name: 'Name',
      render: (tenantname: string) => (
        <>
          {tenantname}
          {tenantname === currentTenant && (
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
      name: 'View Dashboard',
      render: (tenant: string) => (
        <>
          <EuiLink onClick={() => handleTenantSelection(tenant, PAGEID_DICT.DashboardId)}>
            View Dashboard
          </EuiLink>
        </>
      ),
    },
    {
      field: 'tenantValue',
      name: 'View Visualizations',
      render: (tenant: string) => (
        <>
          <EuiLink onClick={() => handleTenantSelection(tenant, PAGEID_DICT.VisualizationId)}>
            View Visualizations
          </EuiLink>
        </>
      ),
    },
    {
      field: 'reserved',
      name: 'Customization',
      render: renderCustomization,
    },
  ];

  let deleteConfirmModal;

  if (isModalVisible) {
    deleteConfirmModal = (
      <EuiOverlayMask>
        <EuiConfirmModal
          title="Confirm Delete"
          onCancel={closeModal}
          onConfirm={handleDelete}
          cancelButtonText="Cancel"
          confirmButtonText="Confirm"
          defaultFocusedButton="confirm"
        >
          <p>Do you really want to delete selected {selection.length} tenants?</p>
        </EuiConfirmModal>
      </EuiOverlayMask>
    );
  }

  const actionsMenuItems = [
    <EuiContextMenuItem
      key="switchTenant"
      disabled={selection.length !== 1}
      onClick={() => handleTenantSelection(selection[0].tenantValue, '')}
    >
      Switch to selected tenant
    </EuiContextMenuItem>,
    <EuiContextMenuItem
      key="edit"
      disabled={selection.length !== 1 || selection[0].reserved}
      onClick={() => showEditModal(selection[0].tenant, Action.edit, selection[0].description)}
    >
      Edit
    </EuiContextMenuItem>,
    <EuiContextMenuItem
      key="duplicate"
      disabled={selection.length !== 1}
      onClick={() =>
        showEditModal(selection[0].tenant + '_copy', Action.duplicate, selection[0].description)
      }
    >
      Duplicate
    </EuiContextMenuItem>,
    <EuiContextMenuItem
      key="createDashboard"
      disabled={selection.length !== 1}
      onClick={() => handleTenantSelection(selection[0].tenantValue, PAGEID_DICT.DashboardId)}
    >
      Create dashboard
    </EuiContextMenuItem>,
    <EuiContextMenuItem
      key="createVisualizations"
      disabled={selection.length !== 1}
      onClick={() => handleTenantSelection(selection[0].tenantValue, PAGEID_DICT.VisualizationId)}
    >
      Create visualizations
    </EuiContextMenuItem>,
    <EuiContextMenuItem
      key="delete"
      onClick={showModal}
      disabled={selection.length === 0 || selection.some((tenant) => tenant.reserved)}
    >
      Delete
    </EuiContextMenuItem>,
  ];

  const actionsButton = (
    <EuiButton
      iconType="arrowDown"
      iconSide="right"
      onClick={() => {
        setActionsPopoverOpen(true);
      }}
    >
      Actions
    </EuiButton>
  );

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
              title: `${tenantName} saved.`,
              color: 'success',
            });
          } catch (e) {
            console.log(e);
            addToast({
              id: 'saveFailed',
              title: `Failed to save ${action} tenant. You may refresh the page to retry or see browser console for more information.`,
              color: 'danger',
            });
          }
        }}
      />
    );
  };

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
              <h3>Tenants ({tenantData.length})</h3>
            </EuiTitle>
            <EuiText size="xs" color="subdued">
              Tenants in Kibana are spaces for saving index patterns, visualizations, dashboards,
              and other Kibana objects. Use tenants to safely share your work with other Kibana
              users. You can control which roles have access to a tenant and whether those roles
              have read or write access. The “Current” label indicates which tenant you are using
              now. Switch to another tenant anytime from your user profile, which is located on the
              top right of the screen.{' '}
              <EuiLink external={true} href="/">
                Learn More
              </EuiLink>
            </EuiText>
          </EuiPageContentHeaderSection>
          <EuiPageContentHeaderSection>
            <EuiFlexGroup>
              <EuiFlexItem>
                <EuiPopover
                  id="actionsMenu"
                  button={actionsButton}
                  isOpen={isActionsPopoverOpen}
                  closePopover={() => {
                    setActionsPopoverOpen(false);
                  }}
                  panelPaddingSize="s"
                >
                  <EuiContextMenuPanel items={actionsMenuItems} />
                </EuiPopover>
              </EuiFlexItem>
              <EuiFlexItem>
                <EuiButton fill onClick={() => showEditModal('', Action.create, '')}>
                  Create tenant
                </EuiButton>
              </EuiFlexItem>
            </EuiFlexGroup>
          </EuiPageContentHeaderSection>
        </EuiPageContentHeader>
        <EuiPageBody>
          <EuiInMemoryTable
            loading={tenantData === [] && !errorFlag}
            columns={columns}
            items={tenantData}
            itemId={'tenant'}
            pagination
            search={{ box: { placeholder: 'Find tenant' } }}
            selection={{ onSelectionChange: setSelection }}
            sorting
            error={errorFlag ? 'Load data failed, please check console log for more detail.' : ''}
          />
        </EuiPageBody>
      </EuiPageContent>
      {editModal}
      {deleteConfirmModal}
      <EuiGlobalToastList toasts={toasts} toastLifeTimeMs={10000} dismissToast={removeToast} />
    </>
  );
}
