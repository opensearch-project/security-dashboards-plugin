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
import { ensureRawRequest } from '../../../../src/core/server/http/router';
import { deflateValue, inflateValue } from '../utils/compression';

export interface ExtraAuthStorageOptions {
  cookiePrefix: string;
  additionalCookies: number;
}

export function getExtraAuthStorageValue(request: any, options: ExtraAuthStorageOptions): string {
  let compressedContent = '';
  let content = '';

  if (options.additionalCookies > 0) {
    compressedContent = unsplitCookiesIntoValue(
      request,
      options.cookiePrefix,
      options.additionalCookies
    );
  }

  try {
    content = inflateValue(Buffer.from(compressedContent, 'base64')).toString();
  } catch (error) {
    throw error;
  }

  return content;
}

/**
 * Compress and split up the given value into multiple cookies
 * @param request
 * @param cookie
 * @param options
 */
export function setExtraAuthStorage(
  request: any,
  content: string,
  options: ExtraAuthStorageOptions
): void {
  if (!options.additionalCookies || options.additionalCookies === 0) {
    return;
  }

  const compressedAuthorizationHeaderValue: Buffer = deflateValue(content);
  const compressedContent = compressedAuthorizationHeaderValue.toString('base64');

  if (options.additionalCookies > 0) {
    splitValueIntoCookies(
      request,
      options.cookiePrefix,
      compressedContent,
      options.additionalCookies
    );
  }
}

export function splitValueIntoCookies(
  request: any, // @todo Should be OpenSearchDashboardsRequest, I believe?
  cookiePrefix: string,
  value: string,
  additionalCookies: number
): void {
  /**
   * Assume that Iron adds around 50%.
   * Remember that an empty cookie is around 30 bytes
   */
  const maxLengthPerCookie = Math.floor(4000 / 1.5);
  const cookiesNeeded = value.length / maxLengthPerCookie; // Assume 1 bit per character since this value is encoded

  // If the amount of additional cookies aren't enough for our logic, we try to write the value anyway
  // TODO We could also consider throwing an error, since a failed cookie leads to weird redirects.
  // But throwing would probably also lead to a weird redirect, since we'd get the token from the IdP again and again
  const splitValueAt =
    cookiesNeeded <= additionalCookies
      ? maxLengthPerCookie
      : Math.ceil(value.length / additionalCookies);

  const rawRequest = ensureRawRequest(request);

  const values: string[] = [];

  for (let i = 1; i <= additionalCookies; i++) {
    values.push(value.substring((i - 1) * splitValueAt, i * splitValueAt));
  }

  values.forEach(async (cookieSplitValue: string, index: number) => {
    const cookieName: string = cookiePrefix + '_' + (index + 1);
    if (cookieSplitValue === '') {
      // Make sure we clean up cookies that are not needed for the given value
      rawRequest.cookieAuth.h.unstate(cookieName);
    } else {
      rawRequest.cookieAuth.h.state(cookieName, cookieSplitValue);
    }
  });
}

export function unsplitCookiesIntoValue(
  request: any,
  cookiePrefix: string,
  additionalCookies: number
): string {
  const rawRequest = ensureRawRequest(request);
  let fullCookieValue = '';

  for (let i = 1; i <= additionalCookies; i++) {
    if (rawRequest.state[cookiePrefix + '_' + i]) {
      fullCookieValue = fullCookieValue + rawRequest.state[cookiePrefix + '_' + i];
    }
  }

  return fullCookieValue;
}

export function clearSplitCookies(request: any, options: ExtraAuthStorageOptions): void {
  const rawRequest = ensureRawRequest(request);
  for (let i = 1; i <= options.additionalCookies; i++) {
    if (rawRequest.state[options.cookiePrefix + '_' + i]) {
      // TODO TypeScript
      rawRequest.cookieAuth.h.unstate(options.cookiePrefix + '_' + i);
    }
  }
}
