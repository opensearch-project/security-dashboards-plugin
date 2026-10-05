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

export const INVALID_NEXT_URL_PARAMETER_MESSAGE = 'Invalid nextUrl parameter.';

/**
 * We require the nextUrl parameter to be a relative url.
 *
 * Here we validate the nextUrl parameter by checking if it meets the following criteria:
 *   - nextUrl starts with the basePath (/ if no serverBasePath is set)
 *   - If nextUrl is longer than 2 chars then the second character must be alphabetical or underscore
 *   - The following characters must be alphanumeric, dash or underscore
 *
 * This validator lives in `common/` so it can be applied identically on the server
 * (route-schema layer, gating request query parameters) and in the client
 * (before triggering `window.location.assign` on a caller-supplied path).
 *
 * @param url url string.
 * @param basePath serverBasePath.
 * @returns error message if nextUrl is invalid, otherwise void (undefined).
 */
export function validateNextUrl(
  url: string | undefined,
  basePath: string | undefined
): string | void {
  if (url) {
    const path = url.split(/\?|#/)[0];
    const bp = basePath || '';
    if (!path.startsWith(bp)) {
      return INVALID_NEXT_URL_PARAMETER_MESSAGE;
    }
    const pathMinusBase = path.replace(bp, '');
    if (
      (pathMinusBase && !pathMinusBase.startsWith('/')) ||
      (pathMinusBase.length >= 2 && !/^\/[a-zA-Z_][\/a-zA-Z0-9-_]+$/.test(pathMinusBase))
    ) {
      return INVALID_NEXT_URL_PARAMETER_MESSAGE;
    }
  }
}
