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

import { SecuritySessionCookie } from './security_cookie';
import { validateNextUrl } from '../utils/next_url';

/** Keep only a short-lived return path, never credentials, across an IdP logout. */
export function createLogoutSession(
  nextUrl: string | undefined,
  basePath: string
): SecuritySessionCookie {
  return {
    logoutNextUrl: nextUrl && !validateNextUrl(nextUrl, basePath) ? nextUrl : basePath || '/',
    expiryTime: Date.now() + 5 * 60 * 1000,
  };
}

export function getLogoutLoginUrl(
  cookie: SecuritySessionCookie | undefined | null,
  basePath: string
): string | undefined {
  if (!cookie?.logoutNextUrl || !cookie.expiryTime || cookie.expiryTime <= Date.now()) {
    return;
  }
  const nextUrl = validateNextUrl(cookie.logoutNextUrl, basePath)
    ? basePath || '/'
    : cookie.logoutNextUrl;
  return `${basePath}/app/login?auto_login=false&nextUrl=${encodeURIComponent(nextUrl)}`;
}
