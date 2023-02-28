/*
 *   Copyright OpenSearch Contributors
 *
 *   Licensed under the Apache License, Version 2.0 (the "License").
 *   You may not use this file except in compliance with the License.
 *   A copy of the License is located at
 *
 *       http://www.apache.org/licenses/LICENSE-2.0
 *
 *   or in the "licens e" file accompanying this file. This file is distributed
 *   on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either
 *   express or implied. See the License for the specific language governing
 *   permissions and limitations under the License.
 */

import { ensureRawRequest } from '../../../../src/core/server/http/router';

export function splitValueIntoCookies(
  request: any, // @todo Should be OpenSearchDashboardsRequest, I believe?
  cookieName: string,
  value: string
): void {
  const rawRequest = ensureRawRequest(request);
  // TODO: Make sure the length is >= 2
  const splitValueAt = Math.ceil(value.length / 2);
  rawRequest.cookieAuth.h.state(cookieName + '_1', value.substring(0, splitValueAt));
  rawRequest.cookieAuth.h.state(cookieName + '_2', value.substring(splitValueAt));
}

export function unsplitCookiesIntoValue(request: any, cookieName: string): string {
  const rawRequest = ensureRawRequest(request);
  let fullCookieValue = '';
  if (rawRequest.state[cookieName + '_1']) {
    fullCookieValue = fullCookieValue + rawRequest.state[cookieName + '_1'];
  }

  if (rawRequest.state[cookieName + '_2']) {
    fullCookieValue = fullCookieValue + rawRequest.state[cookieName + '_2'];
  }

  return fullCookieValue;
}

export function clearSplitCookies(request: any, cookieName: string): void {
  const rawRequest = ensureRawRequest(request);
  rawRequest.cookieAuth.h.unstate(cookieName + '_1');
  rawRequest.cookieAuth.h.unstate(cookieName + '_2');
}
