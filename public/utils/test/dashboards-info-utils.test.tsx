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

const mockHttpGet = jest.fn();

jest.mock('../../apps/configuration/utils/request-utils', () => ({
  createRequestContextWithDataSourceId: jest.fn(() => ({ httpGet: mockHttpGet })),
  createLocalClusterRequestContext: jest.fn(() => ({ httpGet: mockHttpGet })),
}));

import { getDashboardsInfo } from '../dashboards-info-utils';
import {
  createRequestContextWithDataSourceId,
  createLocalClusterRequestContext,
} from '../../apps/configuration/utils/request-utils';

const http = {} as any;

describe('getDashboardsInfo', () => {
  afterEach(() => {
    mockHttpGet.mockReset();
    (createRequestContextWithDataSourceId as jest.Mock).mockClear();
    (createLocalClusterRequestContext as jest.Mock).mockClear();
  });

  it('uses the data source context when a data source id is provided', async () => {
    mockHttpGet.mockResolvedValue({ resource_sharing_enabled: true });
    const res = await getDashboardsInfo(http, 'ds-1');
    expect(createRequestContextWithDataSourceId).toHaveBeenCalledWith('ds-1');
    expect(createLocalClusterRequestContext).not.toHaveBeenCalled();
    expect(res).toEqual({ resource_sharing_enabled: true });
  });

  it('uses the local cluster context when no data source id is provided', async () => {
    mockHttpGet.mockResolvedValue({ resource_sharing_enabled: false });
    const res = await getDashboardsInfo(http);
    expect(createLocalClusterRequestContext).toHaveBeenCalled();
    expect(createRequestContextWithDataSourceId).not.toHaveBeenCalled();
    expect(res).toEqual({ resource_sharing_enabled: false });
  });

  it('treats an empty string data source id as the local cluster', async () => {
    mockHttpGet.mockResolvedValue({});
    await getDashboardsInfo(http, '');
    expect(createLocalClusterRequestContext).toHaveBeenCalled();
    expect(createRequestContextWithDataSourceId).not.toHaveBeenCalled();
  });
});
