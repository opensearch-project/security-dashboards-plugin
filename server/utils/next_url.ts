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

export function composeNextUrlQeuryParam(request: KibanaRequest, basePath: string): string {
  const url = cloneDeep(request.url);
  url.pathname = `${basePath}${url.pathname}`;
  const nextUrl = format(url);
  return stringify({ nextUrl });
}

export const INVALID_NEXT_URL_PARAMETER_MESSAGE = 'Invalid nextUrl parameter.';

/**
 * Ensures the nextUrl parameter is a relative url, the nextUrl parameter should:
 *   1. starts with '/'
 *   2. not start with '//'
 *   3. does not contain '@' in the path
 * @param url url string.
 * @returns error message if nextUrl is invalid, otherwise void.
 */
export const validateNextUrl = (url: string | undefined): string | void => {
  if (url) {
    const path = url.split('?')[0];
    if (!path.startsWith('/') || path.startsWith('//') || path.includes('@')) {
      return INVALID_NEXT_URL_PARAMETER_MESSAGE;
    }
  }
};
