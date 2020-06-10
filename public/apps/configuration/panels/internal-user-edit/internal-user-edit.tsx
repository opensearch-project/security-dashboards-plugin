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
  EuiForm,
  EuiGlobalToastList,
  EuiLink,
  EuiPageHeader,
  EuiSpacer,
  EuiText,
  EuiTitle,
} from '@elastic/eui';
import React, { useCallback, useEffect, useState } from 'react';
import { Toast } from '@elastic/eui/src/components/toast/global_toast_list';
import { BreadcrumbsPageDependencies } from '../../../types';
import { ResourceType } from '../../types';
import { FormRow } from '../../utils/form-row';
import { PanelWithHeader } from '../../utils/panel-with-header';
import { buildHashUrl } from '../../utils/url-builder';

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

function createErrorToast(id: string, failedAction: string): Toast {
  return {
    id,
    color: 'danger',
    title: `Failed to ${failedAction}`,
    text: `Failed to ${failedAction}. You may refresh the page to retry or see browser console for more information.`,
  };
}

export function InternalUserEdit(props: InternalUserEditDeps) {
  const [userName, setUserName] = useState('');

  const [toasts, setToasts] = useState<Toast[]>([]);
  const addToast = useCallback((toastToAdd: Toast) => {
    setToasts((state) => state.concat(toastToAdd));
  }, []);
  const removeToast = (toastToDelete: Toast) => {
    setToasts(toasts.filter((toast) => toast.id !== toastToDelete.id));
  };

  useEffect(() => {
    const action = props.action;
    if (action === 'edit' || action === 'duplicate') {
      const fetchData = async () => {
        try {
          // Fetch user data
          if (action === 'edit') {
            setUserName(props.sourceUserName);
          } else {
            setUserName(props.sourceUserName + '_copy');
          }
        } catch (e) {
          addToast(createErrorToast('fetchUser', 'load data'));
          console.error(e);
        }
      };

      fetchData();
    }
  }, [addToast, props.action, props.coreStart.http, props.sourceUserName]);

  const updateUserHandler = async () => {
    try {
      // TODO: update
    } catch (e) {
      addToast(createErrorToast('updateUser', `${props.action} user`));
      console.error(e);
    }
  };

  return (
    <>
      {props.buildBreadcrumbs(TITLE_TEXT_DICT[props.action])}
      <EuiSpacer />
      <EuiPageHeader>
        <EuiFlexGroup direction='column' gutterSize='xs'><EuiFlexItem>
        <EuiTitle size="l">
            <h1>{TITLE_TEXT_DICT[props.action]}</h1>
          </EuiTitle></EuiFlexItem>
          <EuiFlexItem>
        <EuiText size="xs" color="subdued">

          The security plugin includes an internal user database. Use this database in place of or
          in addtion to an external authentication system such as LDAP or Active Directory{' '}
          <EuiLink external href="/">
            Learn More
          </EuiLink>
        </EuiText></EuiFlexItem>
        </EuiFlexGroup>
      </EuiPageHeader>
      <PanelWithHeader headerText="Credendtials">
        <EuiForm>
          <FormRow
            headerText="Username"
            headerSubText="Specify a descriptive and unique user name. You cannot edit the name once the user is created."
            helpText="The username must contain from m to n characters. Valid characters are 
            lowercase a-z, 0-9 and (-) hyphen."
          >
            <EuiFieldText
              value={userName}
              onChange={(e) => {
                setUserName(e.target.value);
              }}
              disabled={props.action === 'edit'}
            />
          </FormRow>
        </EuiForm>
      </PanelWithHeader>
      <EuiSpacer size="m" />
      <PanelWithHeader
        headerText="Attributes - optional"
        headerSubText="Attributes can be used to further describe the user, and, more importantly they can be used as 
        variables in the Document Level Security query in the index permission of a role. This makes it possible to 
        write dynamic DLS queries based on a user's attributes"
      >
        <EuiForm />
      </PanelWithHeader>
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
          <EuiButton fill onClick={updateUserHandler}>
            {props.action === 'edit' ? 'Save changes' : 'Create'}
          </EuiButton>
        </EuiFlexItem>
      </EuiFlexGroup>
      <EuiGlobalToastList toasts={toasts} toastLifeTimeMs={10000} dismissToast={removeToast} />
    </>
  );
}
