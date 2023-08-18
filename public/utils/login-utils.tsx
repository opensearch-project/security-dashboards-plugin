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
import { String } from 'lodash';
import { httpPost } from '../apps/configuration/utils/request-utils';

export async function validateCurrentPassword(
  http: HttpStart,
  userName: string,
  currentPassword: string
): Promise<void> {
  await httpPost(http, '/auth/login', {
    username: userName,
    password: currentPassword,
  });
}

export function extractNextUrlFromWindowLocation(): string {
  const urlParams = new URLSearchParams(window.location.search);
  let nextUrl = urlParams.get('nextUrl');
  if (!nextUrl || nextUrl.toLowerCase().includes('//')) {
    nextUrl = encodeURIComponent('/');
  } else {
    nextUrl = encodeURIComponent(nextUrl);
    const hash = window.location.hash || '';
    nextUrl += hash;
  }
  return `?nextUrl=${nextUrl}`;
}
