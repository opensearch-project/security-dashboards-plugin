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
import { updateDashboardSignInOptions } from '../../utils/auth-view-utils';
import { DashboardSignInOptions, DashboardOption } from '../../types';
import { HttpSetup } from 'opensearch-dashboards/public';

interface DashboardSignInProps {
  options: DashboardOption[],
  http: HttpSetup
}

export function SignInOptionsModal(props: DashboardSignInProps): JSX.Element {

  const [signInOptions, setSignInOptions] = useState<DashboardOption[]>([]);
  const [disableUpdate, disableUpdateButton] = useState(false);
  const actualSignInOptions: DashboardOption[] = props.options.filter(opt => opt.status);
  
  const [isModalVisible, setIsModalVisible] = useState(false);
  const closeModal = () => setIsModalVisible(false);
  const showModal = () => setIsModalVisible(true);
  
  useEffect(() => {
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

  const handleUpdate = () => {
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
