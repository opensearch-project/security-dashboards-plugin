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
import { Request as HapiRequest, ResponseObject as HapiResponseObject } from '@hapi/hapi';
import { Logger } from '@osd/logging';
import {
  ensureRawRequest,
  OpenSearchDashboardsRequest,
} from '../../../../src/core/server/http/router';
import { deflateValue, inflateValue } from '../utils/compression';
import { ESTIMATED_IRON_COOKIE_OVERHEAD, MAX_LENGTH_OF_COOKIE_BYTES } from '../../common';

export interface ExtraAuthStorageOptions {
  cookiePrefix: string;
  additionalCookies: number;
  logger?: Logger;
}

type CookieAuthWithResponseObject = HapiRequest['cookieAuth'] & { h: HapiResponseObject };

export function getExtraAuthStorageValue(
  request: OpenSearchDashboardsRequest,
  options: ExtraAuthStorageOptions
): string {
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
  request: OpenSearchDashboardsRequest,
  content: string,
  options: ExtraAuthStorageOptions
): void {
  const compressedAuthorizationHeaderValue: Buffer = deflateValue(content);
  const compressedContent = compressedAuthorizationHeaderValue.toString('base64');

  splitValueIntoCookies(
    request,
    options.cookiePrefix,
    compressedContent,
    options.additionalCookies,
    options.logger
  );
}

export function splitValueIntoCookies(
  request: OpenSearchDashboardsRequest, // @todo Should be OpenSearchDashboardsRequest, I believe?
  cookiePrefix: string,
  value: string,
  additionalCookies: number,
  logger?: Logger
): void {
  /**
   * Assume that Iron adds around 50%.
   * Remember that an empty cookie is around 30 bytes
   */

  const maxLengthPerCookie = Math.floor(
    MAX_LENGTH_OF_COOKIE_BYTES / ESTIMATED_IRON_COOKIE_OVERHEAD
  );
  const cookiesNeeded = value.length / maxLengthPerCookie; // Assume 1 bit per character since this value is encoded
  // If the amount of additional cookies aren't enough for our logic, we try to write the value anyway
  // TODO We could also consider throwing an error, since a failed cookie leads to weird redirects.
  // But throwing would probably also lead to a weird redirect, since we'd get the token from the IdP again and again
  let splitValueAt = maxLengthPerCookie;
  if (cookiesNeeded > additionalCookies) {
    splitValueAt = Math.ceil(value.length / additionalCookies);
    if (logger) {
      logger.warn(
        'The payload may be too large for the cookies. To be safe, we would need ' +
          Math.ceil(cookiesNeeded) +
          ' cookies in total, but we only have ' +
          additionalCookies +
          '. This can be changed with opensearch_security.openid.extra_storage.additional_cookies.'
      );
    }
  }

  const rawRequest: HapiRequest = ensureRawRequest(request);

  const values: string[] = [];

  for (let i = 1; i <= additionalCookies; i++) {
    values.push(value.substring((i - 1) * splitValueAt, i * splitValueAt));
  }

  values.forEach(async (cookieSplitValue: string, index: number) => {
    const cookieName: string = cookiePrefix + (index + 1);

    if (cookieSplitValue === '') {
      // Make sure we clean up cookies that are not needed for the given value
      (rawRequest.cookieAuth as CookieAuthWithResponseObject).h.unstate(cookieName);
    } else {
      (rawRequest.cookieAuth as CookieAuthWithResponseObject).h.state(cookieName, cookieSplitValue);
    }
  });
}

export function unsplitCookiesIntoValue(
  request: OpenSearchDashboardsRequest,
  cookiePrefix: string,
  additionalCookies: number
): string {
  const rawRequest: HapiRequest = ensureRawRequest(request);
  let fullCookieValue = '';

  for (let i = 1; i <= additionalCookies; i++) {
    const cookieName = cookiePrefix + i;
    if (rawRequest.state[cookieName]) {
      fullCookieValue = fullCookieValue + rawRequest.state[cookieName];
    }
  }

  return fullCookieValue;
}

export function clearSplitCookies(
  request: OpenSearchDashboardsRequest,
  options: ExtraAuthStorageOptions
): void {
  const rawRequest: HapiRequest = ensureRawRequest(request);
  for (let i = 1; i <= options.additionalCookies; i++) {
    const cookieName = options.cookiePrefix + i;
    if (rawRequest.state[cookieName]) {
      (rawRequest.cookieAuth as CookieAuthWithResponseObject).h.unstate(cookieName);
    }
  }
}
