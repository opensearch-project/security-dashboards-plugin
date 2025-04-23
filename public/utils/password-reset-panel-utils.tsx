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

export async function validateCurrentPassword(
  http: HttpStart,
  userName: string,
  currentPassword: string
) {
  const url = http.basePath.prepend('/auth/login');
  const res = await fetch(url, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      'osd-xsrf': 'true',
    },
    body: JSON.stringify({ username: userName, password: currentPassword }),
  });

  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.message);
  }
}
