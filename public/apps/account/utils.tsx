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

import { HttpStart } from 'opensearch-dashboards/public';
import { API_AUTH_LOGOUT } from '../../../common';
import { setShouldShowTenantPopup } from '../../utils/storage-utils';
import { API_ENDPOINT_ACCOUNT_INFO } from './constants';
import { AccountInfo } from './types';
import { createLocalClusterRequestContext } from '../configuration/utils/request-utils';

export function fetchAccountInfo(http: HttpStart): Promise<AccountInfo> {
  return createLocalClusterRequestContext().httpGet({
    http,
    url: API_ENDPOINT_ACCOUNT_INFO,
  });
}

export async function fetchAccountInfoSafe(http: HttpStart): Promise<AccountInfo | undefined> {
  return createLocalClusterRequestContext().httpGetWithIgnores<AccountInfo>({
    http,
    url: API_ENDPOINT_ACCOUNT_INFO,
    ignores: [401],
  });
}

export async function logout(http: HttpStart, logoutUrl?: string): Promise<void> {
  await createLocalClusterRequestContext().httpPost({
    http,
    url: API_AUTH_LOGOUT,
  });
  setShouldShowTenantPopup(null);
  // Clear everything in the sessionStorage since they can contain sensitive information
  sessionStorage.clear();
  // When no basepath is set, we can take '/' as the basepath.
  const basePath = http.basePath.serverBasePath ? http.basePath.serverBasePath : '/';
  const nextUrl = encodeURIComponent(basePath);
  window.location.href =
    logoutUrl || `${http.basePath.serverBasePath}/app/login?nextUrl=${nextUrl}`;
}

export async function externalLogout(http: HttpStart, logoutEndpoint: string): Promise<void> {
  // This will ensure tenancy is picked up from local storage in the next login.
  setShouldShowTenantPopup(null);
  sessionStorage.clear();
  window.location.href = `${http.basePath.serverBasePath}${logoutEndpoint}`;
}

export async function updateNewPassword(
  http: HttpStart,
  newPassword: string,
  currentPassword: string
): Promise<void> {
  await createLocalClusterRequestContext().httpPost({
    http,
    url: API_ENDPOINT_ACCOUNT_INFO,
    body: {
      password: newPassword,
      current_password: currentPassword,
    },
  });
}
