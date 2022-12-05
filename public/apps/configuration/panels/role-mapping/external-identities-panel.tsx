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

import React, { Dispatch, SetStateAction, Fragment } from 'react';
import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiFieldText,
  EuiButton,
  EuiFormRow,
  EuiSpacer,
} from '@elastic/eui';
import { isEmpty, map } from 'lodash';
import { PanelWithHeader } from '../../utils/panel-with-header';
import { FormRow } from '../../utils/form-row';
import {
  appendElementToArray,
  removeElementFromArray,
  updateElementInArrayHandler,
} from '../../utils/array-state-utils';
import { ExternalIdentityStateClass } from './types';
import { DocLinks } from '../../constants';

export function unbuildExternalIdentityState(
  externalIdentities: ExternalIdentityStateClass[]
): string[] {
  return externalIdentities.map((item) => {
    return item.externalIdentity;
  });
}

export function buildExternalIdentityState(
  externalIdentities: string[]
): ExternalIdentityStateClass[] {
  return map(externalIdentities, (externalIdentity: string) => ({
    externalIdentity,
  }));
}

function getEmptyExternalIdentity() {
  return { externalIdentity: '' };
}

export function ExternalIdentitiesPanel(props: {
  externalIdentities: ExternalIdentityStateClass[];
  setExternalIdentities: Dispatch<SetStateAction<ExternalIdentityStateClass[]>>;
}) {
  const { externalIdentities, setExternalIdentities } = props;
  // Show one empty row if there is no data.
  if (isEmpty(externalIdentities)) {
    setExternalIdentities([getEmptyExternalIdentity()]);
  }

  const panel = externalIdentities.map((externalIdentity, arrayIndex) => {
    const onValueChangeHandler = (externalIdentityToUpdate: string) =>
      updateElementInArrayHandler(setExternalIdentities, [arrayIndex, externalIdentityToUpdate]);

    return (
      <Fragment key={`externalIdentity-${arrayIndex}`}>
        <EuiFlexGroup>
          <EuiFlexItem style={{ maxWidth: '400px' }}>
            <FormRow headerText={arrayIndex === 0 ? 'Backend roles' : ''}>
              <EuiFieldText
                id={`externalIdentity-${arrayIndex}`}
                value={externalIdentity.externalIdentity}
                onChange={(e) => onValueChangeHandler('externalIdentity')(e.target.value)}
                placeholder="Type in backend role"
              />
            </FormRow>
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiFormRow hasEmptyLabelSpace={arrayIndex === 0 ? true : false}>
              <EuiButton
                id={`remove-${arrayIndex}`}
                color="danger"
                onClick={() => removeElementFromArray(setExternalIdentities, [], arrayIndex)}
              >
                Remove
              </EuiButton>
            </EuiFormRow>
          </EuiFlexItem>
        </EuiFlexGroup>
      </Fragment>
    );
  });

  return (
    <PanelWithHeader
      headerText="Backend roles"
      headerSubText="Use a backend role to directly map to roles through an external authentication system."
      helpLink={DocLinks.AccessControlDoc}
    >
      {panel}
      <EuiSpacer />
      <EuiButton
        id="add-row"
        onClick={() => {
          appendElementToArray(setExternalIdentities, [], getEmptyExternalIdentity());
        }}
      >
        Add another backend role
      </EuiButton>
    </PanelWithHeader>
  );
}
