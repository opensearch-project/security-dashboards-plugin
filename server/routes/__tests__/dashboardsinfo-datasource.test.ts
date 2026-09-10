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

import { defineRoutes } from '../index';

interface CapturedRoute {
  cfg: any;
  handler: any;
}

const captureRoutes = (dataSourceEnabled: boolean): CapturedRoute[] => {
  const routes: CapturedRoute[] = [];
  const record = () => (cfg: any, handler: any) => routes.push({ cfg, handler });
  const router: any = {
    get: record(),
    post: record(),
    put: record(),
    delete: record(),
    patch: record(),
  };
  defineRoutes(router, dataSourceEnabled);
  return routes;
};

const findHandler = (routes: CapturedRoute[], suffix: string) =>
  routes.find((r) => typeof r.cfg?.path === 'string' && r.cfg.path.endsWith(suffix))?.handler;

const mockResponse = () => ({ ok: jest.fn((x: any) => x) });

describe('dashboardsinfo route (data source aware)', () => {
  const routes = captureRoutes(true);
  const route = routes.find(
    (r) => typeof r.cfg?.path === 'string' && r.cfg.path.endsWith('/auth/dashboardsinfo')
  );
  const handler = findHandler(routes, '/auth/dashboardsinfo');

  it('registers the dashboardsinfo route with a dataSourceId query param', () => {
    expect(route).toBeDefined();
    expect(route!.cfg.validate).toBeTruthy();
  });

  it('reads from the local cluster when no dataSourceId is provided', async () => {
    const body = { resource_sharing_enabled: true };
    const callAsCurrentUser = jest.fn().mockResolvedValue(body);
    const context: any = {
      security_plugin: { esClient: { asScoped: () => ({ callAsCurrentUser }) } },
    };
    const response = mockResponse();
    await handler(context, { query: {} } as any, response as any);
    expect(callAsCurrentUser).toHaveBeenCalledWith('opensearch_security.dashboardsinfo', undefined);
    expect(response.ok).toHaveBeenCalledWith({ body });
  });

  it('reads from the selected data source when a dataSourceId is provided', async () => {
    const body = { resource_sharing_enabled: false };
    const callAPI = jest.fn().mockResolvedValue(body);
    const getClient = jest.fn(() => ({ callAPI }));
    const context: any = { dataSource: { opensearch: { legacy: { getClient } } } };
    const response = mockResponse();
    await handler(context, { query: { dataSourceId: 'ds-1' } } as any, response as any);
    expect(getClient).toHaveBeenCalledWith('ds-1');
    expect(callAPI).toHaveBeenCalledWith('opensearch_security.dashboardsinfo', undefined);
    expect(response.ok).toHaveBeenCalledWith({ body });
  });
});
