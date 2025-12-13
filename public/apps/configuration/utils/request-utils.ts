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
import { LOCAL_CLUSTER_ID } from '../../../../common';

interface BaseRequestParams {
  url: string;
  body?: object;
}

interface BaseRequestParamsWithIgnores extends BaseRequestParams {
  ignores: number[];
}

interface CreateRequestParams extends BaseRequestParams {
  http: HttpStart;
}

interface ExecuteRequestParams extends BaseRequestParams {
  requestFunc: HttpHandler;
  query: HttpFetchQuery;
}

interface CreateRequestWithIgnoreParams extends BaseRequestParamsWithIgnores {
  http: HttpStart;
}
interface ExecuteRequestWithIgnoreParams extends BaseRequestParamsWithIgnores {
  requestFunc: HttpHandler;
  query: HttpFetchQuery;
}

export function createRequestContextWithDataSourceId(dataSourceId: string) {
  if (dataSourceId === undefined) {
    throw new Error('dataSourceId is not present');
  }
  return new RequestContext(dataSourceId);
}

export function createLocalClusterRequestContext() {
  return new RequestContext(LOCAL_CLUSTER_ID);
}

export class RequestContext {
  query: HttpFetchQuery;
  constructor(private readonly dataSourceId: string) {
    this.query = {
      dataSourceId: this.dataSourceId,
    };
  }

  public async httpGet<T>(params: CreateRequestParams): Promise<T> {
    const { http, url, body } = params;
    return await request<T>({ requestFunc: http.get, url, body, query: this.query });
  }

  public async httpPost<T>(params: CreateRequestParams): Promise<T> {
    const { http, url, body } = params;
    return await request<T>({ requestFunc: http.post, url, body, query: this.query });
  }

  public async httpPut<T>(params: CreateRequestParams): Promise<T> {
    const { http, url, body } = params;
    return await request<T>({ requestFunc: http.put, url, body, query: this.query });
  }

  public async httpDelete<T>(params: CreateRequestParams): Promise<T> {
    const { http, url, body } = params;
    return await request<T>({ requestFunc: http.delete, url, body, query: this.query });
  }

  public async httpDeleteWithIgnores<T>(
    params: CreateRequestWithIgnoreParams
  ): Promise<T | undefined> {
    const { http, url, ignores } = params;
    return await requestWithIgnores<T>({
      requestFunc: http.delete,
      url,
      ignores,
      query: this.query,
    });
  }

  public async httpGetWithIgnores<T>(
    params: CreateRequestWithIgnoreParams
  ): Promise<T | undefined> {
    const { http, url, ignores } = params;
    return await requestWithIgnores<T>({ requestFunc: http.get, url, ignores, query: this.query });
  }

  public async httpGetWithQuery<T>(
    http: HttpStart,
    url: string,
    queryParams?: Record<string, any>
  ): Promise<T> {
    const query = { ...this.query, ...queryParams };
    return (await http.get(url, { query })) as T;
  }
}

export async function request<T>(params: ExecuteRequestParams): Promise<T> {
  const { requestFunc, url, body, query } = params;
  if (body) {
    return (await requestFunc(url, { body: JSON.stringify(body), query })) as T;
  }
  return (await requestFunc(url, { query })) as T;
}

/**
 * Send a request but ignore some error codes (suppress exception)
 * @param requestFunc
 * @param url
 * @param ignores the error codes to be ignored
 */
export async function requestWithIgnores<T>(
  params: ExecuteRequestWithIgnoreParams
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
