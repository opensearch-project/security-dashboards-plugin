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

const findRoute = (routes: CapturedRoute[], suffix: string) =>
  routes.find((r) => typeof r.cfg?.path === 'string' && r.cfg.path.endsWith(suffix));

const mockResponse = () => ({ ok: jest.fn((x: any) => x) });

describe('resource_sharing_enabled route (minimal, data source aware)', () => {
  const routes = captureRoutes(true);
  const route = findRoute(routes, '/auth/resource_sharing_enabled');
  const handler = route?.handler;

  it('registers the route with a dataSourceId query param', () => {
    expect(route).toBeDefined();
    expect(route!.cfg.validate).toBeTruthy();
  });

  it('returns only the boolean from the local cluster when no dataSourceId is provided', async () => {
    const callAsCurrentUser = jest
      .fn()
      .mockResolvedValue({ resource_sharing_enabled: true, default_tenant: 'secret' });
    const context: any = {
      security_plugin: { esClient: { asScoped: () => ({ callAsCurrentUser }) } },
    };
    const response = mockResponse();
    await handler(context, { query: {} } as any, response as any);
    // Only the flag is returned; no other dashboardsinfo config leaks.
    expect(response.ok).toHaveBeenCalledWith({ body: { enabled: true } });
  });

  it('returns only the boolean from the selected data source when a dataSourceId is provided', async () => {
    const callAPI = jest
      .fn()
      .mockResolvedValue({ resource_sharing_enabled: false, default_tenant: 'secret' });
    const getClient = jest.fn(() => ({ callAPI }));
    const context: any = { dataSource: { opensearch: { legacy: { getClient } } } };
    const response = mockResponse();
    await handler(context, { query: { dataSourceId: 'ds-1' } } as any, response as any);
    expect(getClient).toHaveBeenCalledWith('ds-1');
    expect(response.ok).toHaveBeenCalledWith({ body: { enabled: false } });
  });
});
