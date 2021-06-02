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
import { getWithIgnores } from '../configuration/utils/request-utils';

export function fetchAccountInfo(http: HttpStart): Promise<AccountInfo> {
  return http.get(API_ENDPOINT_ACCOUNT_INFO);
}

export async function fetchAccountInfoSafe(http: HttpStart): Promise<AccountInfo | undefined> {
  return getWithIgnores<AccountInfo>(http, API_ENDPOINT_ACCOUNT_INFO, [401]);
}

export async function logout(http: HttpStart): Promise<void> {
  await http.post(API_AUTH_LOGOUT);
  const nextUrl = encodeURIComponent(http.basePath.serverBasePath);
  window.location.href = `${http.basePath.serverBasePath}/app/login?nextUrl=${nextUrl}`;
}
