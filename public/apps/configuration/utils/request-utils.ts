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

import { HttpStart, HttpHandler } from 'kibana/public';

/**
 * Send a request but ignore some error codes (suppress exception)
 * @param requestFunc
 * @param url
 * @param ignores the error codes to be ignored
 */
export async function requestWithIgnores<T>(
  requestFunc: HttpHandler,
  url: string,
  ignores: number[]
): Promise<T | undefined> {
  try {
    return (await requestFunc(url)) as T;
  } catch (e) {
    if (!ignores.includes(e?.body.statusCode)) {
      throw e;
    }
  }
}

export async function getWithIgnores<T>(
  http: HttpStart,
  url: string,
  ignores: number[]
): Promise<T | undefined> {
  return await requestWithIgnores<T>(http.get, url, ignores);
}

export async function deleteWithIgnores<T>(
  http: HttpStart,
  url: string,
  ignores: number[]
): Promise<T | undefined> {
  return await requestWithIgnores<T>(http.delete, url, ignores);
}
