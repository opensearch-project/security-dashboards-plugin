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

import { cloneDeep } from 'lodash';
import { format } from 'url';
import { stringify } from 'querystring';
import { KibanaRequest } from 'kibana/server';
import normalizeUrl from 'normalize-url';

export function composeNextUrlQeuryParam(request: KibanaRequest, basePath: string): string {
  const url = cloneDeep(request.url);
  url.pathname = `${basePath}${url.pathname}`;
  const nextUrl = format(url);
  return stringify({ nextUrl });
}

export const INVALID_NEXT_URL_PARAMETER_MESSAGE = 'Invalid nextUrl parameter.';

/**
 * We require the nextUrl parameter to be an relative url.
 *
 * Here we leverage the normalizeUrl function. If the library can parse the url
 * parameter, which means it is an absolute url, then we reject it. Otherwise, the
 * library cannot parse the url, which means it is not an absolute url, we let to
 * go through.
 * Note: url has been decoded by Kibana.
 *
 * @param url url string.
 * @returns error message if nextUrl is invalid, otherwise void.
 */
export const validateNextUrl = (url: string | undefined): string | void => {
  if (url) {
    try {
      normalizeUrl(url);
    } catch (error) {
      return;
    }
    return INVALID_NEXT_URL_PARAMETER_MESSAGE;
  }
};
