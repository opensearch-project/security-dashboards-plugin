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
  EuiBasicTable,
  EuiButton,
  EuiModal,
  EuiModalBody,
  EuiModalFooter,
  EuiModalHeader,
  EuiModalHeaderTitle,
  EuiSpacer
} from '@elastic/eui';
import React, { useEffect, useState } from 'react';
import { columns } from './dashboard-signin-options';
import { DashboardOption } from '../../types';
import { HttpSetup } from 'opensearch-dashboards/public';
import { updateTenancyConfiguration } from '../../utils/tenant-utils';
import { TenancyConfigSettings } from '../tenancy-config/types';
import { getDashboardsInfo } from '../../../../utils/dashboards-info-utils';

interface DashboardSignInProps {
  options: DashboardOption[],
  http: HttpSetup
}

export function SignInOptionsModal(props: DashboardSignInProps): JSX.Element {

  const [signInOptions, setSignInOptions] = useState<DashboardOption[]>([]);
  const [disableUpdate, disableUpdateButton] = useState(false);
  const actualSignInOptions: DashboardOption[] = props.options.filter(opt => opt.status);
  const [tenantConfig, setTenantConfig] = useState<TenancyConfigSettings>({default_tenant: ""});
  
  const [isModalVisible, setIsModalVisible] = useState(false);
  const closeModal = () => setIsModalVisible(false);
  const showModal = () => setIsModalVisible(true);

  useEffect(() => {
    const getTenantConfiguration = async () => {
      const dashboardsInfo = await getDashboardsInfo(props.http);
      setTenantConfig( {
          multitenancy_enabled: dashboardsInfo.multitenancy_enabled,
          default_tenant: dashboardsInfo.default_tenant,
          private_tenant_enabled: dashboardsInfo.private_tenant_enabled,
          dashboard_signin_options: []
      });
    }

    getTenantConfiguration();
  }, [])
  

  useEffect(() => {
    setTenantConfig({...tenantConfig, dashboard_signin_options: signInOptions.map(opt => opt.name)});
    if(actualSignInOptions.length != signInOptions.length && signInOptions.length > 0){
      disableUpdateButton(false);
    } else {
      let sameOptions = true;
      signInOptions.forEach(option => {
        if(actualSignInOptions.includes(option) == false){
          sameOptions = false;
          return;
        }
      });
      disableUpdateButton(sameOptions);
    }

  }, [signInOptions])

  const handleUpdate = async () => {
    await updateTenancyConfiguration(props.http, tenantConfig);
    closeModal();
  }

  let modal;

  if (isModalVisible) {
    modal = (
      <EuiModal onClose={closeModal}>
        <EuiModalHeader>
          <EuiModalHeaderTitle>Dashboard Sign In Options</EuiModalHeaderTitle>
        </EuiModalHeader>
        <EuiModalBody>
          Enable/Disable sign-in options for OpenSearch Dashboard.
          <EuiSpacer />
          <EuiBasicTable
            tableCaption="Dashboard sign in options available"
            items={props.options}
            rowHeader="name"
            columns={columns.slice(0, 1)}
            itemId={'name'}
            selection={{ 
              onSelectionChange: setSignInOptions, 
              initialSelected: actualSignInOptions,
          }}
          />
        </EuiModalBody>
        <EuiModalFooter>
          <EuiButton onClick={closeModal}>
            Cancel
          </EuiButton>
          <EuiButton onClick={handleUpdate} fill disabled={disableUpdate}>
            Update
          </EuiButton>
        </EuiModalFooter>
      </EuiModal>
    );
  }
  return (
    <div>
      <EuiButton onClick={showModal}>Edit</EuiButton>
      {modal}
    </div>
  );
};
