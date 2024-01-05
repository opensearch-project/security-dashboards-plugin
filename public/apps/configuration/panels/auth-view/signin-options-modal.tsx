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

import React, { Dispatch, SetStateAction } from 'react';
import { DashboardOption } from '../../types';
import { columns } from './dashboard-signin-options';
import {
  OuiButtonEmpty,
  OuiButton,
  OuiModal,
  OuiModalBody,
  OuiModalFooter,
  OuiModalHeader,
  OuiModalHeaderTitle,
  OuiSpacer,
  OuiCheckboxGroup
} from '@opensearch-project/oui';

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
      <OuiModal onClose={closeModal}>
        <OuiModalHeader>
          <OuiModalHeaderTitle>Dashboards sign-in options</OuiModalHeaderTitle>
        </OuiModalHeader>
        <OuiModalBody>
          Select one or multiple authentication options to appear on the sign-in window for OpenSearch Dashboards.
          <OuiSpacer />

          <OuiCheckboxGroup
            options={props.dashboardOptions.map((option) => ({
              label: option.name,
              value: option,
              checked: option.status,
            }))}
            onChange={(selectedOptions) => {
              setNewSignInOptions(selectedOptions.map((option) => option.value));
            }}
          />
        </OuiModalBody>
        <OuiModalFooter>
          <OuiButtonEmpty onClick={closeModal}>Cancel</OuiButtonEmpty>
          <OuiButton
            data-testid="update"
            onClick={() => {
              props.handleUpdate(newSignInOptions);
              closeModal();
            }}
            fill
            disabled={disableUpdate}
          >
            Update
          </OuiButton>
        </OuiModalFooter>
      </OuiModal>
    );
  }
  return (
    <div>
      <OuiButton data-testid="edit" onClick={showModal}>
        Edit
      </OuiButton>
      {modal}
    </div>
  );
}
