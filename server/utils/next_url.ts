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

import { parse } from 'url';
import { ParsedUrlQuery } from 'querystring';
import { OpenSearchDashboardsRequest } from 'opensearch-dashboards/server';
import { encodeUriQuery } from '../../../../src/plugins/opensearch_dashboards_utils/common/url/encode_uri_query';

export function composeNextUrlQueryParam(
  request: OpenSearchDashboardsRequest,
  basePath: string
): string {
  try {
    const currentUrl = request.url.toString();
    const parsedUrl = parse(currentUrl, true);
    const nextUrl = parsedUrl?.path;

    if (!!nextUrl && nextUrl !== '/') {
      return `nextUrl=${encodeUriQuery(basePath + nextUrl)}`;
    }
  } catch (error) {
    /* Ignore errors from parsing */
  }
  return '';
}

export interface ParsedUrlQueryParams extends ParsedUrlQuery {
  nextUrl: string;
}

export const INVALID_NEXT_URL_PARAMETER_MESSAGE = 'Invalid nextUrl parameter.';

/**
 * We require the nextUrl parameter to be an relative url.
 *
 * Here we leverage the normalizeUrl function. If the library can parse the url
 * parameter, which means it is an absolute url, then we reject it. Otherwise, the
 * library cannot parse the url, which means it is not an absolute url, we let to
 * go through.
 * Note: url has been decoded by OpenSearchDashboards.
 *
 * @param url url string.
 * @returns error message if nextUrl is invalid, otherwise void.
 */
export const validateNextUrl = (url: string | undefined): string | void => {
  if (url) {
    const path = url.split('?')[0];
    if (
      !path.startsWith('/') ||
      path.startsWith('//') ||
      path.includes('\\') ||
      path.includes('@')
    ) {
      return INVALID_NEXT_URL_PARAMETER_MESSAGE;
    }
  }
};
