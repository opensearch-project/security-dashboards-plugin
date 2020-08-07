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

import { CoreStart } from 'kibana/public';
import { API_ENDPOINT_ACCOUNT_INFO } from './constants';
import { AccountInfo } from './types';

export function fetchAccountInfo(core: CoreStart): Promise<AccountInfo> {
  return core.http.get(API_ENDPOINT_ACCOUNT_INFO);
}

export async function checkInternalUser(core: CoreStart): Promise<boolean> {
  try {
    const accountInfo = await fetchAccountInfo(core);
    return accountInfo?.data?.is_internal_user;
  } catch (e) {
    // ignore 401 and continue to login page.
    if (e?.body.statusCode !== 401) {
      throw e;
    }
  }
  return false;
}
