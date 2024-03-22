/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 *
 * Modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

import React, { Dispatch, SetStateAction } from 'react';
import { DashboardOption } from '../../types';

import {
  EuiButton,
  EuiInMemoryTable,
  EuiModal,
  EuiModalBody,
  EuiModalFooter,
  EuiModalHeader,
  EuiModalHeaderTitle,
  EuiSpacer,
} from '@elastic/eui';
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
          <EuiModalHeaderTitle>Dashboards sign-in options</EuiModalHeaderTitle>
        </EuiModalHeader>
        <EuiModalBody>
          Select one or multiple authentication options to appear on the sign-in window for
          OpenSearch Dashboards.
          <EuiSpacer />
          <EuiInMemoryTable
            tableLayout={'auto'}
            columns={columns.slice(0, 1)}
            items={props.dashboardOptions}
            itemId={'name'}
            selection={{
              onSelectionChange: setNewSignInOptions,
              initialSelected: actualSignInOptions,
            }}
            sorting={{ sort: { field: 'displayName', direction: 'asc' } }}
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
