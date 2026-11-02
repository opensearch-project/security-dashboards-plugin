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
import { getRedirectUrl } from '../../../../src/core/server/http';

// The validator itself lives in common/ so the same function can be reused from
// public/ code that redirects after login. Re-exported here for backward compat
// with existing server-side callers.
export {
  validateNextUrl,
  INVALID_NEXT_URL_PARAMETER_MESSAGE,
} from '../../common/next_url_validation';

export function composeNextUrlQueryParam(
  request: OpenSearchDashboardsRequest,
  basePath: string
): string {
  try {
    const currentUrl = request.url.toString();
    const parsedUrl = parse(currentUrl, true);
    const nextUrl = parsedUrl?.path;

    if (!!nextUrl && nextUrl !== '/') {
      return `nextUrl=${encodeUriQuery(
        getRedirectUrl({
          request,
          basePath,
          nextUrl,
        })
      )}`;
    }
  } catch (error) {
    /* Ignore errors from parsing */
  }
  return '';
}

export interface ParsedUrlQueryParams extends ParsedUrlQuery {
  nextUrl: string;
}
