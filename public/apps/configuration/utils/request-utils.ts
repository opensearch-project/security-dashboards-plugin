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

interface RequestParams {
  requestFunc: HttpHandler;
  url: string;
  body?: object;
  query?: HttpFetchQuery;
}

export async function request<T>(params: RequestParams): Promise<T> {
  const { requestFunc, url, body, query } = params;
  if (body) {
    return (await requestFunc(url, { body: JSON.stringify(body), query })) as T;
  }
  return (await requestFunc(url, { query })) as T;
}

export async function httpGet<T>(params: RequestType): Promise<T> {
  const { http, url, body, query } = params;
  return await request<T>({ requestFunc: http.get, url, body, query });
}

export async function httpPost<T>(params: RequestType): Promise<T> {
  const { http, url, body, query } = params;
  return await request<T>({ requestFunc: http.post, url, body, query });
}

export async function httpPut<T>(http: HttpStart, url: string, body?: object): Promise<T> {
  return await request<T>({ requestFunc: http.put, url, body });
}

export async function httpDelete<T>(params: RequestType): Promise<T> {
  const { http, url, body, query } = params;
  return await request<T>({ requestFunc: http.delete, url, body, query });
}

interface RequestTypeWithIgnore extends RequestType {
  ignores: number[];
}
interface RequestParamsWithIgnore extends RequestParams {
  ignores: number[];
}

/**
 * Send a request but ignore some error codes (suppress exception)
 * @param requestFunc
 * @param url
 * @param ignores the error codes to be ignored
 */
export async function requestWithIgnores<T>(
  params: RequestParamsWithIgnore
): Promise<T | undefined> {
  const { requestFunc, url, ignores, body, query } = params;
  try {
    return await request<T>({ requestFunc, url, body, query });
  } catch (e) {
    if (!ignores.includes(e?.response?.status)) {
      throw e;
    }
  }
}

export async function httpGetWithIgnores<T>(params: RequestTypeWithIgnore): Promise<T | undefined> {
  const { http, url, ignores, query } = params;
  return await requestWithIgnores<T>({ requestFunc: http.get, url, ignores, query });
}

export async function httpPostWithIgnores<T>(
  params: RequestTypeWithIgnore
): Promise<T | undefined> {
  const { http, url, ignores, query } = params;
  return await requestWithIgnores<T>({ requestFunc: http.post, url, ignores, query });
}

export async function httpDeleteWithIgnores<T>(
  params: RequestTypeWithIgnore
): Promise<T | undefined> {
  const { http, url, ignores, query } = params;
  return await requestWithIgnores<T>({ requestFunc: http.delete, url, ignores, query });
}
