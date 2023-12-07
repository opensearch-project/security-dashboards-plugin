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
import { Toast } from '@elastic/eui/src/components/toast/global_toast_list';
import { HttpSetup } from 'opensearch-dashboards/public';
import React, { useEffect, useState } from 'react';
import { updateDashboardSignInOptions } from '../../../../utils/dashboards-info-utils';
import { DashboardOption } from '../../types';
import { createErrorToast, createSuccessToast } from '../../utils/toast-utils';
import { columns } from './dashboard-signin-options';
import { Dispatch } from 'react';
import { SetStateAction } from 'react';

interface DashboardSignInProps {
  dashboardOptions: DashboardOption[];
  setDashboardOptions: Dispatch<SetStateAction<DashboardOption[]>>;
  http: HttpSetup;
  addToast: (toAdd: Toast) => void;
}

export function SignInOptionsModal(props: DashboardSignInProps): JSX.Element {
  const [newSignInOptions, setNewSignInOptions] = useState<DashboardOption[]>([]);
  const [disableUpdate, disableUpdateButton] = useState(false);
  const actualSignInOptions: DashboardOption[] = props.dashboardOptions.filter((opt) => opt.status);

  const [isModalVisible, setIsModalVisible] = useState(false);
  const closeModal = () => setIsModalVisible(false);
  const showModal = () => setIsModalVisible(true);

  useEffect(() => {
    if (actualSignInOptions.length != newSignInOptions.length && newSignInOptions.length > 0) {
      disableUpdateButton(false);
    } else {
      let sameOptions = true;
      newSignInOptions.forEach((option) => {
        if (actualSignInOptions.includes(option) == false) {
          sameOptions = false;
          return;
        }
      });
      disableUpdateButton(sameOptions);
    }
  }, [newSignInOptions]);

  const handleUpdate = async () => {
    await updateDashboardSignInOptions(
      props.http,
      newSignInOptions.map((opt) => opt.name)
    )
      .then(() => {
        changeDashboardSignInOptionsStatus();
        props.addToast(
          createSuccessToast('updatePassed', 'Dashboard SignIn Options', 'Changes applied.')
        );
      })
      .catch((e) => {
        console.log('The sign in options could not be updated');
        console.log(e);
        props.addToast(
          createErrorToast('updatedError', 'Dashboard SignIn Options', 'Error updating values.')
        );
      })
      .finally(() => {
        closeModal();
      });
  };

  let modal;

  const changeDashboardSignInOptionsStatus = () => {
    props.setDashboardOptions((prevOptions) =>
      prevOptions.map((option) => {
        option.status = newSignInOptions.includes(option);
        return option;
      })
    );
  };

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
}
