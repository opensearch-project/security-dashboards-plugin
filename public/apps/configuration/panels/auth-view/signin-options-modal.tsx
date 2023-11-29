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
import React, { useState } from 'react';
import { DashboardOption, columns } from './dashboard-signin-options';

interface DashboardSignInProps {
  options: DashboardOption[]
}

export function SignInOptionsModal(props: DashboardSignInProps): JSX.Element {

  const [signInOptions, setSignInOptions] = React.useState<DashboardOption[]>([]);
  
  const [isModalVisible, setIsModalVisible] = useState(false);
  const closeModal = () => setIsModalVisible(false);
  const showModal = () => setIsModalVisible(true);

  const handleSave = () => {
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
            columns={columns.slice(0,2)}
            itemId={'name'}
            selection={{ 
              onSelectionChange: setSignInOptions, 
              initialSelected: props.options.filter(opt => opt.status),
          }}
          />
        </EuiModalBody>
        <EuiModalFooter>
          <EuiButton onClick={closeModal}>
            Close
          </EuiButton>
          <EuiButton onClick={handleSave} fill>
            Save
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
