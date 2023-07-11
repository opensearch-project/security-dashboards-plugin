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
  EuiFlexGroup,
  EuiFlexItem,
  EuiForm,
  EuiGlobalToastList,
  EuiPageHeader,
  EuiSpacer,
  EuiText,
  EuiTitle,
} from '@elastic/eui';
import React, { useState } from 'react';
import { BreadcrumbsPageDependencies } from '../../../types';
import { InternalUserUpdate, ResourceType } from '../../types';
import { getUserDetail, updateUser } from '../../utils/internal-user-detail-utils';
import { PanelWithHeader } from '../../utils/panel-with-header';
import { PasswordEditPanel } from '../../utils/password-edit-panel';
import {
  createErrorToast,
  createUnknownErrorToast,
  useToastState,
  getSuccessToastMessage,
} from '../../utils/toast-utils';
import { buildHashUrl, buildUrl } from '../../utils/url-builder';
import { AttributePanel, buildAttributeState, unbuildAttributeState } from './attribute-panel';
import { UserAttributeStateClass } from './types';
import { setCrossPageToast } from '../../utils/storage-utils';
import { ExternalLink } from '../../utils/display-utils';
import { generateResourceName } from '../../utils/resource-utils';
import { NameRow } from '../../utils/name-row';
import { DocLinks } from '../../constants';
import { constructErrorMessageAndLog } from '../../../error-utils';
import { BackendRolePanel } from './backend-role-panel';

interface InternalUserEditDeps extends BreadcrumbsPageDependencies {
  action: 'create' | 'edit' | 'duplicate';
  // For creation, sourceUserName should be empty string.
  // For editing, sourceUserName should be the name of the user to edit.
  // For duplication, sourceUserName should be the name of the user to copy from.
  sourceUserName: string;
}

const TITLE_TEXT_DICT = {
  create: 'Create internal user',
  edit: 'Edit internal user',
  duplicate: 'Duplicate internal user',
};

export function InternalUserEdit(props: InternalUserEditDeps) {
  const [userName, setUserName] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [isPasswordInvalid, setIsPasswordInvalid] = React.useState<boolean>(false);
  const [attributes, setAttributes] = useState<UserAttributeStateClass[]>([]);
  const [backendRoles, setBackendRoles] = useState<string[]>([]);

  const [toasts, addToast, removeToast] = useToastState();

  const [isFormValid, setIsFormValid] = useState<boolean>(true);

  React.useEffect(() => {
    const action = props.action;
    if (action === 'edit' || action === 'duplicate') {
      const fetchData = async () => {
        try {
          const user = await getUserDetail(props.coreStart.http, props.sourceUserName);
          setAttributes(buildAttributeState(user.attributes));
          setBackendRoles(user.backend_roles);
          setUserName(generateResourceName(action, props.sourceUserName));
        } catch (e) {
          addToast(createUnknownErrorToast('fetchUser', 'load data'));
          console.error(e);
        }
      };

      fetchData();
    }
  }, [addToast, props.action, props.coreStart.http, props.sourceUserName]);

  const updateUserHandler = async () => {
    try {
      if (isPasswordInvalid) {
        addToast(createErrorToast('passwordInvalid', 'Update error', 'Password does not match.'));
        return;
      }

      if (password === '' && props.action !== 'edit') {
        addToast(createErrorToast('emptyPassword', 'Update error', 'Password is required.'));
        return;
      }

      // Remove attributes with empty key
      const validAttributes = attributes.filter((v: UserAttributeStateClass) => v.key !== '');

      const updateObject: InternalUserUpdate = {
        backend_roles: backendRoles,
        attributes: unbuildAttributeState(validAttributes),
      };

      // Password field should be omitted if not updating password.
      if (password !== '') {
        updateObject.password = password;
      }

      await updateUser(props.coreStart.http, userName, updateObject);

      setCrossPageToast(buildUrl(ResourceType.users), {
        id: 'updateUserSucceeded',
        color: 'success',
        title: getSuccessToastMessage('User', props.action, userName),
      });
      // Redirect to user listing
      window.location.href = buildHashUrl(ResourceType.users);
    } catch (e) {
      addToast(
        createErrorToast('updateUserFailed', 'Update error', constructErrorMessageAndLog(e, ''))
      );
    }
  };

  return (
    <>
      {props.buildBreadcrumbs(TITLE_TEXT_DICT[props.action])}
      <EuiSpacer />
      <EuiPageHeader>
        <EuiFlexGroup direction="column" gutterSize="xs">
          <EuiFlexItem>
            <EuiTitle size="l">
              <h1>{TITLE_TEXT_DICT[props.action]}</h1>
            </EuiTitle>
          </EuiFlexItem>
          <EuiFlexItem>
            <EuiText size="xs" color="subdued">
              The security plugin includes an internal user database. Use this database in place of,
              or in addition to, an external authentication system such as LDAP or Active Directory.{' '}
              <ExternalLink href={DocLinks.UsersAndRolesDoc} />
            </EuiText>
          </EuiFlexItem>
        </EuiFlexGroup>
      </EuiPageHeader>
      <PanelWithHeader headerText="Credentials">
        <EuiForm>
          <NameRow
            headerText="Username"
            headerSubText="Specify a descriptive and unique user name. You cannot edit the name once the user is created."
            resourceName={userName}
            resourceType="user"
            action={props.action}
            setNameState={setUserName}
            setIsFormValid={setIsFormValid}
          />
          <PasswordEditPanel
            coreStart={props.coreStart}
            updatePassword={setPassword}
            updateIsInvalid={setIsPasswordInvalid}
          />
        </EuiForm>
      </PanelWithHeader>
      <EuiSpacer size="m" />
      <BackendRolePanel state={backendRoles} setState={setBackendRoles} />
      <EuiSpacer size="m" />
      <AttributePanel state={attributes} setState={setAttributes} />
      <EuiSpacer size="m" />
      <EuiFlexGroup justifyContent="flexEnd">
        <EuiFlexItem grow={false}>
          <EuiButton
            onClick={() => {
              window.location.href = buildHashUrl(ResourceType.users);
            }}
          >
            Cancel
          </EuiButton>
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiButton id="submit" fill onClick={updateUserHandler} disabled={!isFormValid}>
            {props.action === 'edit' ? 'Save changes' : 'Create'}
          </EuiButton>
        </EuiFlexItem>
      </EuiFlexGroup>
      <EuiGlobalToastList toasts={toasts} toastLifeTimeMs={10000} dismissToast={removeToast} />
    </>
  );
}
