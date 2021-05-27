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

import { HttpStart } from 'kibana/public';
import { API_AUTH_LOGOUT } from '../../../common';
import { API_ENDPOINT_ACCOUNT_INFO } from './constants';
import { AccountInfo } from './types';
import { httpGet, httpGetWithIgnores, httpPost } from '../configuration/utils/request-utils';
import { setShouldShowTenantPopup } from '../../utils/storage-utils';

export function fetchAccountInfo(http: HttpStart): Promise<AccountInfo> {
  return httpGet(http, API_ENDPOINT_ACCOUNT_INFO);
}

export async function fetchAccountInfoSafe(http: HttpStart): Promise<AccountInfo | undefined> {
  return httpGetWithIgnores<AccountInfo>(http, API_ENDPOINT_ACCOUNT_INFO, [401]);
}

export async function logout(http: HttpStart, logoutUrl?: string): Promise<void> {
  await httpPost(http, API_AUTH_LOGOUT);
  setShouldShowTenantPopup(null);
  window.location.href = logoutUrl || `${http.basePath.serverBasePath}/app/login`;
}

export async function updateNewPassword(
  http: HttpStart,
  newPassword: string,
  currentPassword: string
): Promise<void> {
  await httpPost(http, API_ENDPOINT_ACCOUNT_INFO, {
    password: newPassword,
    current_password: currentPassword,
  });
}
