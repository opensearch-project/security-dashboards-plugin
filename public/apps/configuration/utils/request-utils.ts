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

import { HttpStart, HttpHandler, HttpFetchQuery } from 'opensearch-dashboards/public';

interface RequestType {
  http: HttpStart;
  url: string;
  body?: object;
  query?: HttpFetchQuery;
}

export async function request<T>(
  requestFunc: HttpHandler,
  url: string,
  body?: object,
  query?: HttpFetchQuery
): Promise<T> {
  if (body) {
    return (await requestFunc(url, { body: JSON.stringify(body), query })) as T;
  }
  return (await requestFunc(url, { query })) as T;
}

export async function httpGet<T>(params: RequestType): Promise<T> {
  const { http, url, body, query } = params;
  return await request<T>(http.get, url, body, query);
}

export async function httpPost<T>(params: RequestType): Promise<T> {
  const { http, url, body, query } = params;
  return await request<T>(http.post, url, body, query);
}

export async function httpPut<T>(http: HttpStart, url: string, body?: object): Promise<T> {
  return await request<T>(http.put, url, body);
}

export async function httpDelete<T>(params: RequestType): Promise<T> {
  const { http, url, body, query } = params;
  return await request<T>(http.delete, url, body, query);
}

/**
 * Send a request but ignore some error codes (suppress exception)
 * @param requestFunc
 * @param url
 * @param ignores the error codes to be ignored
 */
export async function requestWithIgnores<T>(
  requestFunc: HttpHandler,
  url: string,
  ignores: number[],
  body?: object
): Promise<T | undefined> {
  try {
    return await request<T>(requestFunc, url, body);
  } catch (e) {
    if (!ignores.includes(e?.response?.status)) {
      throw e;
    }
  }
}

export async function httpGetWithIgnores<T>(
  http: HttpStart,
  url: string,
  ignores: number[]
): Promise<T | undefined> {
  return await requestWithIgnores<T>(http.get, url, ignores);
}

export async function httpPostWithIgnores<T>(
  http: HttpStart,
  url: string,
  ignores: number[]
): Promise<T | undefined> {
  return await requestWithIgnores<T>(http.post, url, ignores);
}

export async function httpDeleteWithIgnores<T>(
  http: HttpStart,
  url: string,
  ignores: number[]
): Promise<T | undefined> {
  return await requestWithIgnores<T>(http.delete, url, ignores);
}
