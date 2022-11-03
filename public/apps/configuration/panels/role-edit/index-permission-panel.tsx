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
  EuiAccordion,
  EuiButton,
  EuiComboBox,
  EuiFlexGroup,
  EuiFlexItem,
  EuiHorizontalRule,
  EuiSuperSelect,
  EuiTextArea,
} from '@elastic/eui';
import React, { Dispatch, Fragment, SetStateAction } from 'react';
import { isEmpty } from 'lodash';
import { RoleIndexPermission, ResourceType } from '../../types';
import {
  appendElementToArray,
  removeElementFromArray,
  updateElementInArrayHandler,
} from '../../utils/array-state-utils';
import {
  appendOptionToComboBoxHandler,
  comboBoxOptionToString,
  stringToComboBoxOption,
} from '../../utils/combo-box-utils';
import { FormRow } from '../../utils/form-row';
import { PanelWithHeader } from '../../utils/panel-with-header';
import { RoleIndexPermissionStateClass } from './types';
import { FieldLevelSecurityMethod, ComboBoxOptions } from '../../types';
import { getFieldLevelSecurityMethod } from '../../utils/index-permission-utils';
import { LIMIT_WIDTH_INPUT_CLASS } from '../../constants';
import { buildHashUrl } from '../../utils/url-builder';
import { ExternalLinkButton } from '../../utils/display-utils';
import { DocLinks } from '../../constants';

export function getEmptyIndexPermission(): RoleIndexPermissionStateClass {
  return {
    indexPatterns: [],
    allowedActions: [],
    docLevelSecurity: '',
    fieldLevelSecurityMethod: 'exclude',
    fieldLevelSecurityFields: [],
    maskedFields: [],
  };
}

/**
 * Remove the leading ~ which indicates exclude and convert to combo box option.
 * @param fieldLevelSecurityRawFields fields fetched from backend
 * ["~field1", "~field2"] => ["field1", "field2"]
 * ["field1", "field2"] => ["field1", "field2"]
 */
function getFieldLevelSecurityFields(fieldLevelSecurityRawFields: string[]): ComboBoxOptions {
  return fieldLevelSecurityRawFields
    .map((s: string) => s.replace(/^~/, ''))
    .map(stringToComboBoxOption);
}

function packFieldLevelSecurity(method: FieldLevelSecurityMethod, fieldOptions: ComboBoxOptions) {
  const fields = fieldOptions.map(comboBoxOptionToString);
  if (method === 'include') {
    return fields;
  }
  return fields.map((field) => '~' + field);
}

export function buildIndexPermissionState(
  indexPerm: RoleIndexPermission[]
): RoleIndexPermissionStateClass[] {
  return indexPerm.map((perm) => ({
    indexPatterns: perm.index_patterns.map(stringToComboBoxOption),
    allowedActions: perm.allowed_actions.map(stringToComboBoxOption),
    docLevelSecurity: perm.dls,
    fieldLevelSecurityMethod: getFieldLevelSecurityMethod(perm.fls),
    fieldLevelSecurityFields: getFieldLevelSecurityFields(perm.fls),
    maskedFields: perm.masked_fields.map(stringToComboBoxOption),
  }));
}

export function unbuildIndexPermissionState(
  indexPerm: RoleIndexPermissionStateClass[]
): RoleIndexPermission[] {
  return indexPerm.map((perm) => ({
    index_patterns: perm.indexPatterns.map(comboBoxOptionToString),
    dls: perm.docLevelSecurity,
    fls: packFieldLevelSecurity(perm.fieldLevelSecurityMethod, perm.fieldLevelSecurityFields),
    masked_fields: perm.maskedFields.map(comboBoxOptionToString),
    allowed_actions: perm.allowedActions.map(comboBoxOptionToString),
  }));
}

const FIELD_LEVEL_SECURITY_PLACEHOLDER = `{
    "bool": {
        "must": {
            "match": {
                "genres": "Comedy"
            }
        }
    }
}`;

export function IndexPatternRow(props: {
  value: ComboBoxOptions;
  onChangeHandler: (s: ComboBoxOptions) => void;
  onCreateHandler: (s: string) => void;
}) {
  return (
    <FormRow headerText="Index" helpText="Specify index pattern using *">
      <EuiFlexItem className={LIMIT_WIDTH_INPUT_CLASS}>
        <EuiComboBox
          noSuggestions
          placeholder="Search for index name or type in index pattern"
          selectedOptions={props.value}
          onChange={props.onChangeHandler}
          onCreateOption={props.onCreateHandler}
          id="index-input-box"
        />
      </EuiFlexItem>
    </FormRow>
  );
}

export function IndexPermissionRow(props: {
  value: ComboBoxOptions;
  permisionOptionsSet: ComboBoxOptions;
  onChangeHandler: (s: ComboBoxOptions) => void;
}) {
  return (
    <FormRow
      headerText="Index permissions"
      headerSubText="You can specify permissions using both action groups or single permissions. 
        A permission group is a list of single permissions.
        You can often achieve your desired security posture using some combination of the default permission groups. 
        You can also create your own reusable permission groups."
    >
      <EuiFlexGroup>
        <EuiFlexItem className={LIMIT_WIDTH_INPUT_CLASS}>
          <EuiComboBox
            placeholder="Search for action group name or permission name"
            options={props.permisionOptionsSet}
            selectedOptions={props.value}
            onChange={props.onChangeHandler}
            id="roles-index-permission-box"
          />
        </EuiFlexItem>
        {/* TODO: 'Browse and select' button with a pop-up modal for selection */}
        <EuiFlexItem grow={false}>
          <ExternalLinkButton
            href={buildHashUrl(ResourceType.permissions)}
            text="Create new permission group"
          />
        </EuiFlexItem>
      </EuiFlexGroup>
    </FormRow>
  );
}

export function DocLevelSecurityRow(props: {
  value: string;
  onChangeHandler: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
}) {
  return (
    <FormRow
      headerText="Document level security"
      headerSubText="You can restrict a role to a subset of documents in an index."
      helpLink={DocLinks.DocumentLevelSecurityDoc}
      optional
    >
      <EuiTextArea
        placeholder={FIELD_LEVEL_SECURITY_PLACEHOLDER}
        value={props.value}
        onChange={props.onChangeHandler}
      />
    </FormRow>
  );
}

export function FieldLevelSecurityRow(props: {
  method: FieldLevelSecurityMethod;
  fields: ComboBoxOptions;
  onMethodChangeHandler: (s: string) => void;
  onFieldChangeHandler: (s: ComboBoxOptions) => void;
  onFieldCreateHandler: (s: string) => void;
}) {
  return (
    <FormRow
      headerText="Field level security"
      headerSubText="You can restrict what document fields a user can see. If you use field-level security in conjunction with document-level security, make sure you don't restrict access to the field that document-level security uses."
      optional
    >
      <EuiFlexGroup>
        <EuiFlexItem grow={1}>
          <EuiSuperSelect
            valueOfSelected={props.method}
            options={[
              { inputDisplay: 'Include', value: 'include' },
              { inputDisplay: 'Exclude', value: 'exclude' },
            ]}
            onChange={props.onMethodChangeHandler}
          />
        </EuiFlexItem>
        <EuiFlexItem grow={9}>
          <EuiComboBox
            noSuggestions
            placeholder="Type in field name"
            selectedOptions={props.fields}
            onChange={props.onFieldChangeHandler}
            onCreateOption={props.onFieldCreateHandler}
          />
        </EuiFlexItem>
      </EuiFlexGroup>
    </FormRow>
  );
}

export function AnonymizationRow(props: {
  value: ComboBoxOptions;
  onChangeHandler: (s: ComboBoxOptions) => void;
  onCreateHandler: (s: string) => void;
}) {
  return (
    <FormRow
      headerText="Anonymization"
      headerSubText="Masks any sensitive fields with a random value to protect your data security."
      optional
    >
      <EuiComboBox
        noSuggestions
        placeholder="Type in field name"
        selectedOptions={props.value}
        onChange={props.onChangeHandler}
        onCreateOption={props.onCreateHandler}
      />
    </FormRow>
  );
}

export function generateIndexPermissionPanels(
  indexPermissions: RoleIndexPermissionStateClass[],
  permisionOptionsSet: ComboBoxOptions,
  setRoleIndexPermission: Dispatch<SetStateAction<RoleIndexPermissionStateClass[]>>
) {
  const panels = indexPermissions.map((permission, arrayIndex) => {
    const onValueChangeHandler = (attributeToUpdate: string) =>
      updateElementInArrayHandler(setRoleIndexPermission, [arrayIndex, attributeToUpdate]);

    const onCreateOptionHandler = (attributeToUpdate: string) =>
      appendOptionToComboBoxHandler(setRoleIndexPermission, [arrayIndex, attributeToUpdate]);

    return (
      <Fragment key={`index-permission-${arrayIndex}`}>
        <EuiAccordion
          id={`index-permission-${arrayIndex}`}
          initialIsOpen={arrayIndex === 0}
          buttonContent={
            permission.indexPatterns.map(comboBoxOptionToString).join(', ') ||
            'Add index permission'
          }
          extraAction={
            <EuiButton
              color="danger"
              onClick={() => removeElementFromArray(setRoleIndexPermission, [], arrayIndex)}
            >
              Remove
            </EuiButton>
          }
        >
          <IndexPatternRow
            value={permission.indexPatterns}
            onChangeHandler={onValueChangeHandler('indexPatterns')}
            onCreateHandler={onCreateOptionHandler('indexPatterns')}
          />
          <IndexPermissionRow
            value={permission.allowedActions}
            permisionOptionsSet={permisionOptionsSet}
            onChangeHandler={onValueChangeHandler('allowedActions')}
          />
          <DocLevelSecurityRow
            value={permission.docLevelSecurity}
            onChangeHandler={(e) => onValueChangeHandler('docLevelSecurity')(e.target.value)}
          />
          <FieldLevelSecurityRow
            method={permission.fieldLevelSecurityMethod}
            fields={permission.fieldLevelSecurityFields}
            onMethodChangeHandler={onValueChangeHandler('fieldLevelSecurityMethod')}
            onFieldChangeHandler={onValueChangeHandler('fieldLevelSecurityFields')}
            onFieldCreateHandler={onCreateOptionHandler('fieldLevelSecurityFields')}
          />
          <AnonymizationRow
            value={permission.maskedFields}
            onChangeHandler={onValueChangeHandler('maskedFields')}
            onCreateHandler={onCreateOptionHandler('maskedFields')}
          />
        </EuiAccordion>
        <EuiHorizontalRule />
      </Fragment>
    );
  });
  return <>{panels}</>;
}

export function IndexPermissionPanel(props: {
  state: RoleIndexPermissionStateClass[];
  optionUniverse: ComboBoxOptions;
  setState: Dispatch<SetStateAction<RoleIndexPermissionStateClass[]>>;
}) {
  const { state, optionUniverse, setState } = props;
  // Show one empty row if there is no data.
  if (isEmpty(state)) {
    setState([getEmptyIndexPermission()]);
  }
  return (
    <PanelWithHeader
      headerText="Index permissions"
      headerSubText="Index permissions allow you to specify how users in this role can access the specific indices. By default, no index permission is granted."
      helpLink={DocLinks.IndexPermissionsDoc}
    >
      {generateIndexPermissionPanels(state, optionUniverse, setState)}
      <EuiButton
        onClick={() => {
          appendElementToArray(setState, [], getEmptyIndexPermission());
        }}
      >
        Add another index permission
      </EuiButton>
    </PanelWithHeader>
  );
}
