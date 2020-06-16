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
  EuiButton,
  EuiFieldText,
  EuiFlexGroup,
  EuiFlexItem,
  EuiSpacer,
  EuiFormRow,
} from '@elastic/eui';
import { map } from 'lodash';
import React, { Dispatch, Fragment, SetStateAction } from 'react';
import { UserAttributes } from '../../types';
import {
  appendElementToArray,
  removeElementFromArray,
  updateElementInArrayHandler,
} from '../../utils/array-state-utils';
import { PanelWithHeader } from '../../utils/panel-with-header';
import { UserAttributeStateClass } from './types';
import { FormRow } from '../../utils/form-row';

export function buildAttributeState(attributesDict: UserAttributes): UserAttributeStateClass[] {
  return map(attributesDict, (v, k) => ({
    key: k || '',
    value: v,
  }));
}

export function unbuildAttributeState(attributesList: UserAttributeStateClass[]): UserAttributes {
  return attributesList.reduce(
    (attributes: UserAttributes, { key, value }: UserAttributeStateClass) => ({
      ...attributes,
      [key]: value,
    }),
    {}
  );
}

function getEmptyAttribute() {
  return { key: '', value: '' };
}

function generateAttributesPanels(
  userAttributes: UserAttributeStateClass[],
  setAttributes: Dispatch<SetStateAction<UserAttributeStateClass[]>>
) {
  const panels = userAttributes.map((userAttribute, arrayIndex) => {
    const onValueChangeHandler = (attributeToUpdate: string) =>
      updateElementInArrayHandler(setAttributes, [arrayIndex, attributeToUpdate]);

    return (
      <Fragment key={`attributes-${arrayIndex}`}>
        <EuiFlexGroup>
          <EuiFlexItem grow={false}>
            <FormRow headerText={arrayIndex === 0 ? 'Variable name' : ''}>
              <EuiFieldText
                value={userAttribute.key}
                onChange={onValueChangeHandler('key')}
                placeholder="Type in variable name"
              />
            </FormRow>
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <FormRow headerText={arrayIndex === 0 ? 'Value' : ''}>
              <EuiFieldText
                value={userAttribute.value}
                onChange={onValueChangeHandler('value')}
                placeholder="Type in value"
              />
            </FormRow>
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiFormRow hasEmptyLabelSpace={arrayIndex === 0 ? true : false}>
              <EuiButton
                color="danger"
                onClick={() => removeElementFromArray(setAttributes, [], arrayIndex)}
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

export function AttributePanel(props: {
  state: UserAttributeStateClass[];
  setState: Dispatch<SetStateAction<UserAttributeStateClass[]>>;
}) {
  const { state, setState } = props;
  return (
    <PanelWithHeader
      headerText="Attributes"
      headerSubText="Attributes can be used to further describe the user, and, more importantly they can be used as 
      variables in the Document Level Security query in the index permission of a role. This makes it possible to 
      write dynamic DLS queries based on a user's attributes"
      helpLink="/"
      optional
    >
      {generateAttributesPanels(state, setState)}
      <EuiSpacer />
      <EuiButton
        onClick={() => {
          appendElementToArray(setState, [], getEmptyAttribute());
        }}
      >
        Add another attribute
      </EuiButton>
    </PanelWithHeader>
  );
}
