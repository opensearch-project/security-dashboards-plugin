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
  EuiButton,
  EuiFieldText,
  EuiFlexGroup,
  EuiFlexItem,
  EuiSpacer,
  EuiFormRow,
} from '@elastic/eui';
import { isEmpty } from 'lodash';
import React, { Dispatch, Fragment, SetStateAction, useState } from 'react';
import {
  appendElementToArray,
  removeElementFromArray,
  updateElementInArrayHandler,
} from '../../utils/array-state-utils';
import { PanelWithHeader } from '../../utils/panel-with-header';
import { DocLinks, LIMIT_WIDTH_INPUT_CLASS } from '../../constants';

function generateBackendRolesPanels(
  backendRoles: string[],
  setBackendRoles: Dispatch<SetStateAction<string[]>>,
  emptyRoleIndex: number,
  roleEmptyErrorMessage: string,
  setRoleEmptyErrorMessage: Dispatch<SetStateAction<string>>
) {
  const panels = backendRoles.map((backendRole, arrayIndex) => {
    return (
      <Fragment key={`backend-role-${arrayIndex}`}>
        <EuiFlexGroup>
          <EuiFlexItem className={LIMIT_WIDTH_INPUT_CLASS}>
            <EuiFormRow
              label={arrayIndex === 0 ? 'Backend role' : ''}
              error={roleEmptyErrorMessage}
              isInvalid={arrayIndex === emptyRoleIndex && !isEmpty(roleEmptyErrorMessage)}
            >
              <EuiFieldText
                isInvalid={arrayIndex === emptyRoleIndex && !isEmpty(roleEmptyErrorMessage)}
                id={`backend-role-${arrayIndex}`}
                value={backendRole}
                onChange={(e) => {
                  updateElementInArrayHandler(setBackendRoles, [arrayIndex])(e.target.value);
                  setRoleEmptyErrorMessage('');
                }}
                placeholder="Type in backend role"
              />
            </EuiFormRow>
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiFormRow hasEmptyLabelSpace={arrayIndex === 0 ? true : false}>
              <EuiButton
                id={`backend-role-delete-${arrayIndex}`}
                color="danger"
                onClick={() => removeElementFromArray(setBackendRoles, [], arrayIndex)}
              >
                Remove
              </EuiButton>
            </EuiFormRow>
          </EuiFlexItem>
        </EuiFlexGroup>
      </Fragment>
    );
  });

  return <>{panels}</>;
}

export function BackendRolePanel(props: {
  state: string[];
  setState: Dispatch<SetStateAction<string[]>>;
}) {
  const { state, setState } = props;
  const [roleEmptyErrorMessage, setRoleEmptyErrorMessage] = useState('');
  const [emptyRoleIndex, setEmptyRoleIndex] = useState(-1);
  // Show one empty row if there is no data.
  if (isEmpty(state)) {
    setState(['']);
  }
  return (
    <PanelWithHeader
      headerText="Backend roles"
      headerSubText="Backend roles are used to map users from external authentication systems, such as LDAP or SAML to OpenSearch security roles."
      helpLink={DocLinks.AccessControlDoc}
      optional
    >
      {generateBackendRolesPanels(
        state,
        setState,
        emptyRoleIndex,
        roleEmptyErrorMessage,
        setRoleEmptyErrorMessage
      )}
      <EuiSpacer />
      <EuiButton
        id="backend-role-add-row"
        onClick={() => {
          if (state.indexOf('') !== -1) {
            setRoleEmptyErrorMessage('Type a backend role before adding a new one');
            setEmptyRoleIndex(state.indexOf(''));
          } else {
            setRoleEmptyErrorMessage('');
            appendElementToArray(setState, [], '');
          }
        }}
      >
        Add another backend role
      </EuiButton>
    </PanelWithHeader>
  );
}
