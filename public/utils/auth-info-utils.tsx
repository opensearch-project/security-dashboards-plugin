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
import { API_ENDPOINT_AUTHINFO } from '../../common';
import { httpGet } from '../apps/configuration/utils/request-utils';
import { AuthInfo } from '../types';

export async function getAuthInfo(http: HttpStart) {
  return await httpGet<AuthInfo>(http, API_ENDPOINT_AUTHINFO);
}

export async function getCurrentUser(http: HttpStart) {
  return (await getAuthInfo(http)).user_name;
}
