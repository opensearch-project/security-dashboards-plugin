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
  EuiSpacer,
} from '@elastic/eui';
import React, { Dispatch, SetStateAction } from 'react';
import { DashboardOption } from '../../types';
import { columns } from './dashboard-signin-options';

interface DashboardSignInProps {
  dashboardOptions: DashboardOption[];
  setDashboardOptions: Dispatch<SetStateAction<DashboardOption[]>>;
  handleUpdate: Function;
}

export function SignInOptionsModal(props: DashboardSignInProps): JSX.Element {
  const [newSignInOptions, setNewSignInOptions] = React.useState<DashboardOption[]>([]);
  const [disableUpdate, disableUpdateButton] = React.useState(false);
  const actualSignInOptions: DashboardOption[] = props.dashboardOptions.filter((opt) => opt.status);

  const [isModalVisible, setIsModalVisible] = React.useState(false);
  const closeModal = () => setIsModalVisible(false);
  const showModal = () => setIsModalVisible(true);

  React.useEffect(() => {
    if (actualSignInOptions.length !== newSignInOptions.length && newSignInOptions.length > 0) {
      disableUpdateButton(false);
    } else {
      let sameOptions = true;
      newSignInOptions.forEach((option) => {
        if (actualSignInOptions.includes(option) === false) {
          sameOptions = false;
          return;
        }
      });
      disableUpdateButton(sameOptions);
    }
  }, [newSignInOptions, actualSignInOptions]);

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
            items={props.dashboardOptions}
            rowHeader="name"
            columns={columns.slice(0, 1)}
            itemId={'name'}
            selection={{
              onSelectionChange: setNewSignInOptions,
              initialSelected: actualSignInOptions,
            }}
          />
        </EuiModalBody>
        <EuiModalFooter>
          <EuiButton onClick={closeModal}>Cancel</EuiButton>
          <EuiButton
            data-testid="update"
            onClick={() => {
              props.handleUpdate(newSignInOptions);
              closeModal();
            }}
            fill
            disabled={disableUpdate}
          >
            Update
          </EuiButton>
        </EuiModalFooter>
      </EuiModal>
    );
  }
  return (
    <div>
      <EuiButton data-testid="edit" onClick={showModal}>
        Edit
      </EuiButton>
      {modal}
    </div>
  );
}
