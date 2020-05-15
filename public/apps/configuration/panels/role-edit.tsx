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
  EuiAccordion,
  EuiButton,
  EuiComboBox,
  EuiComboBoxOptionOption,
  EuiFieldText,
  EuiFlexGroup,
  EuiFlexItem,
  EuiForm,
  EuiHorizontalRule,
  EuiLink,
  EuiPageHeader,
  EuiSpacer,
  EuiSuperSelect,
  EuiText,
  EuiTextArea,
  EuiTitle,
} from '@elastic/eui';
import React, { Dispatch, Fragment, SetStateAction, useEffect, useState } from 'react';
import { AppDependencies } from '../../types';
import { CLUSTER_PERMISSIONS, INDEX_PERMISSIONS } from '../constants';
import { RoleIndexPermission } from '../types';
import { fetchActionGroups } from '../utils/action-groups-utils';
import { FormRow } from '../utils/form-row';
import {
  appendElementToArray,
  removeElementFromArray,
  updateElementInArrayHandler,
} from '../utils/array-state-utils';
import { PanelWithHeader } from '../utils/panel-with-header';
import { getRoleDetail } from '../utils/role-detail-utils';
import {
  stringToComboBoxOption,
  comboBoxOptionToString,
  appendOptionToComboBoxHandler,
} from '../utils/combo-box-utils';

interface RoleEditDeps extends AppDependencies {
  action: 'create' | 'edit' | 'duplicate';
  // For creation, sourceRoleName should be empty string.
  // For editing, sourceRoleName should be the name of the role to edit.
  // For duplication, sourceRoleName should be the name of the role to copy from.
  sourceRoleName: string;
}

const TITLE_TEXT_DICT = {
  create: 'Create Role',
  edit: 'Edit Role',
  duplicate: 'Duplicate Role',
};

// Break down this file by sub panels.

type OptionSeletion = EuiComboBoxOptionOption[];
type FieldLevelSecurityMethod = 'exclude' | 'include';

interface RoleIndexPermissionStateClass {
  indexPatterns: OptionSeletion;
  docLevelSecurity: string;
  fieldLevelSecurityMethod: FieldLevelSecurityMethod;
  fieldLevelSecurityFields: OptionSeletion;
  maskedFields: OptionSeletion;
  allowedActions: OptionSeletion;
}

function getEmptyIndexPermission(): RoleIndexPermissionStateClass {
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
 * Identify the method is whether exclude or include.
 * @param fieldLevelSecurityRawFields fields fetched from backend
 * ["~field1", "~field2"] => exclude
 * ["field1", "field2"] => include
 */
function getFieldLevelSecurityMethod(
  fieldLevelSecurityRawFields: string[]
): FieldLevelSecurityMethod {
  // Leading ~ indicates exclude.
  return fieldLevelSecurityRawFields.some((s: string) => s.startsWith('~')) ? 'exclude' : 'include';
}

/**
 * Remove the leading ~ which indicates exclude and convert to combo box option.
 * @param fieldLevelSecurityRawFields fields fetched from backend
 * ["~field1", "~field2"] => ["field1", "field2"]
 * ["field1", "field2"] => ["field1", "field2"]
 */
function getFieldLevelSecurityFields(fieldLevelSecurityRawFields: string[]): OptionSeletion {
  return fieldLevelSecurityRawFields
    .map((s: string) => s.replace(/^~/, ''))
    .map(stringToComboBoxOption);
}

function buildIndexPermissionState(
  indexPerm: RoleIndexPermission[]
): RoleIndexPermissionStateClass[] {
  return indexPerm.map(perm => ({
    indexPatterns: perm.index_patterns.map(stringToComboBoxOption),
    allowedActions: [],
    docLevelSecurity: perm.dls,
    fieldLevelSecurityMethod: getFieldLevelSecurityMethod(perm.fls),
    fieldLevelSecurityFields: getFieldLevelSecurityFields(perm.fls),
    maskedFields: [],
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

function IndexPatternRow(props: {
  value: OptionSeletion;
  onChangeHandler: (s: OptionSeletion) => void;
  onCreateHandler: (s: string) => void;
}) {
  return (
    <FormRow headerText="Index" helpText="Specify index pattern using *">
      <EuiComboBox
        noSuggestions
        placeholder="Search for index name or type in index pattern"
        selectedOptions={props.value}
        onChange={props.onChangeHandler}
        onCreateOption={props.onCreateHandler}
      />
    </FormRow>
  );
}

function IndexPermissionRow(props: {
  value: OptionSeletion;
  permisionOptionsSet: OptionSeletion;
  onChangeHandler: (s: OptionSeletion) => void;
}) {
  return (
    <FormRow
      headerText="Index permissions"
      headerSubText="You can specify permissions using both action groups or single permissions. 
        An permission group is a list of single permissions.
        You can often achieve your desired security posture using some combination of the default permission groups. 
        You can also create your own reusable permission groups."
    >
      <EuiFlexGroup>
        <EuiFlexItem style={{ maxWidth: '400px' }}>
          <EuiComboBox
            placeholder="Search for action group name or permission name"
            options={props.permisionOptionsSet}
            selectedOptions={props.value}
            onChange={props.onChangeHandler}
          />
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiButton>Browse and select</EuiButton>
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiButton iconType="popout" iconSide="right">
            Create new permission group
          </EuiButton>
        </EuiFlexItem>
      </EuiFlexGroup>
    </FormRow>
  );
}

function DocLevelSecurityRow(props: {
  value: string;
  onChangeHandler: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
}) {
  return (
    <FormRow
      headerText="Document level security"
      headerSubText="You can restrict a role to a subset of documents in an index."
      helpLink="/"
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

function FieldLevelSecurityRow(props: {
  method: FieldLevelSecurityMethod;
  fields: OptionSeletion;
  onMethodChangeHandler: (s: string) => void;
  onFieldChangeHandler: (s: OptionSeletion) => void;
  onFieldCreateHandler: (s: string) => void;
}) {
  return (
    <FormRow
      headerText="Field level security"
      headerSubText="You can restrict what document fields that user can see. If you use field-level security in conjunction with document-level security, make sure you don't restrict access to the field that document-level security uses."
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

function AnonymizationRow(props: {
  value: OptionSeletion;
  onChangeHandler: (s: OptionSeletion) => void;
  onCreateHandler: (s: string) => void;
}) {
  return (
    <FormRow
      headerText="Anonymization"
      headerSubText="Masks any sensitive fields with random value to protect your data security."
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

function generateIndexPermissionPanels(
  indexPermissions: RoleIndexPermissionStateClass[],
  permisionOptionsSet: EuiComboBoxOptionOption[],
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
          buttonContent={
            permission.indexPatterns.map(comboBoxOptionToString).join(', ') || 'Add index permission'
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
            onChangeHandler={e => onValueChangeHandler('docLevelSecurity')(e.target.value)}
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

export function RoleEdit(props: RoleEditDeps) {
  const [roleName, setRoleName] = useState('');
  const [roleClusterPermission, setRoleClusterPermission] = useState<OptionSeletion>([]);
  const [roleIndexPermission, setRoleIndexPermission] = useState<RoleIndexPermissionStateClass[]>(
    []
  );

  useEffect(() => {
    const action = props.action;
    if (action == 'edit' || action == 'duplicate') {
      const fetchData = async () => {
        try {
          const roleData = await getRoleDetail(props.coreStart.http, props.sourceRoleName);
          setRoleClusterPermission(roleData.cluster_permissions.map(stringToComboBoxOption));
          setRoleIndexPermission(buildIndexPermissionState(roleData.index_permissions));

          if (action == 'edit') {
            setRoleName(props.sourceRoleName);
          } else {
            setRoleName(props.sourceRoleName + '_copy');
          }
        } catch (e) {
          // TODO: show user friendly error message
          console.log(e);
        }
      };

      fetchData();
    }
  }, [props.sourceRoleName]);

  const [actionGroups, setActionGroups] = useState<string[]>([]);
  useEffect(() => {
    const fetchActionGroupNames = async () => {
      try {
        const actionGroupsObject = await fetchActionGroups(props.coreStart.http);
        setActionGroups(Object.keys(actionGroupsObject));
      } catch (e) {
        // TODO: show user friendly error message
        console.log(e);
      }
    };

    fetchActionGroupNames();
  }, []);

  const clusterWisePermissionOptions = [
    {
      label: 'Permission groups',
      options: actionGroups.map(stringToComboBoxOption),
    },
    {
      label: 'Cluster permissions',
      options: CLUSTER_PERMISSIONS.map(stringToComboBoxOption),
    },
    {
      label: 'Index permissions',
      options: INDEX_PERMISSIONS.map(stringToComboBoxOption),
    },
  ];

  return (
    <>
      <EuiPageHeader>
        <EuiText size="xs" color="subdued">
          <EuiTitle size="m">
            <h1>{TITLE_TEXT_DICT[props.action]}</h1>
          </EuiTitle>
          Roles are the core way of controlling access to your cluster. Roles contain any
          combination of cluster-wide permission, index-specific permissions, document- and
          field-level security, and tenants. Once you've created the role, you can map users to
          these roles so that users gain those permissions.{' '}
          <EuiLink external href="/">
            Learn More
          </EuiLink>
        </EuiText>
      </EuiPageHeader>
      <PanelWithHeader headerText="Name">
        <EuiForm>
          <FormRow
            headerText="Name"
            headerSubText="Specify a descriptive and unique role name. You cannot edit the name onece the role is created."
            helpText="The Role name must contain from m to n characters. Valid characters are 
            lowercase a-z, 0-9 and (-) hyphen."
          >
            <EuiFieldText
              value={roleName}
              onChange={e => {
                setRoleName(e.target.value);
              }}
              disabled={props.action == 'edit'}
            />
          </FormRow>
        </EuiForm>
      </PanelWithHeader>
      <EuiSpacer size="m" />
      <PanelWithHeader
        headerText="Cluster Permissions"
        headerSubText="Specify how users in this role can access the cluster. By default, no cluster permission is granted."
        helpLink="/"
      >
        <EuiForm>
          <FormRow
            headerText="Cluster Permissions"
            headerSubText="Specify permissions using either action groups or single permissions. An action group is a list of single permissions.
            You can often achieve your desired security posture using some combination of the default permission groups. You can
            also create your own reusable permission groups."
          >
            <EuiFlexGroup>
              <EuiFlexItem style={{ maxWidth: '400px' }}>
                <EuiComboBox
                  options={clusterWisePermissionOptions}
                  selectedOptions={roleClusterPermission}
                  onChange={setRoleClusterPermission}
                />
              </EuiFlexItem>
              <EuiFlexItem grow={false}>
                <EuiButton>Browse and select</EuiButton>
              </EuiFlexItem>
              <EuiFlexItem grow={false}>
                <EuiButton iconType="popout" iconSide="right">
                  Create Action Groups
                </EuiButton>
              </EuiFlexItem>
            </EuiFlexGroup>
          </FormRow>
        </EuiForm>
      </PanelWithHeader>
      <EuiSpacer size="m" />
      <PanelWithHeader
        headerText="Index Permissions"
        headerSubText="Index permissions allow you to specify how users in this role can access the specific indices. By default, no index permission is granted."
        helpLink="/"
      >
        {generateIndexPermissionPanels(
          roleIndexPermission,
          clusterWisePermissionOptions,
          setRoleIndexPermission
        )}
        <EuiButton
          onClick={() => {
            appendElementToArray(setRoleIndexPermission, [], getEmptyIndexPermission());
          }}
        >
          Add another index permission
        </EuiButton>
      </PanelWithHeader>
      <EuiSpacer size="m" />
      <PanelWithHeader
        headerText="Tenants"
        headerSubText="Tenants are useful for safely sharing your work with other Kibana users. You can control which roles have access to a tenant and whether those rolels have read or write access."
        helpLink="/"
      ></PanelWithHeader>
    </>
  );
}
