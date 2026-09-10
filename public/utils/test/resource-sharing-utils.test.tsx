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

const mockHttpGetWithQuery = jest.fn();

jest.mock('../../apps/configuration/utils/request-utils', () => ({
  createRequestContextWithDataSourceId: jest.fn(() => ({
    httpGetWithQuery: mockHttpGetWithQuery,
  })),
  createLocalClusterRequestContext: jest.fn(() => ({
    httpGetWithQuery: mockHttpGetWithQuery,
  })),
}));

jest.mock('../dashboards-info-utils', () => ({
  getDashboardsInfo: jest.fn(),
}));

import { isResourceSharingAvailable } from '../resource-sharing-utils';
import {
  createRequestContextWithDataSourceId,
  createLocalClusterRequestContext,
} from '../../apps/configuration/utils/request-utils';
import { getDashboardsInfo } from '../dashboards-info-utils';

const mockGetDashboardsInfo = getDashboardsInfo as jest.Mock;

const http = {} as any;

describe('isResourceSharingAvailable', () => {
  beforeEach(() => {
    // Global feature flag ON by default; individual tests override as needed.
    mockGetDashboardsInfo.mockResolvedValue({ resource_sharing_enabled: true });
  });

  afterEach(() => {
    mockHttpGetWithQuery.mockReset();
    mockGetDashboardsInfo.mockReset();
    (createRequestContextWithDataSourceId as jest.Mock).mockClear();
    (createLocalClusterRequestContext as jest.Mock).mockClear();
  });

  it('returns true when the feature is enabled and the type is registered', async () => {
    mockHttpGetWithQuery.mockResolvedValue({
      types: [{ type: 'anomaly-detector' }, { type: 'monitor' }],
    });
    await expect(isResourceSharingAvailable(http, 'anomaly-detector', 'ds-1')).resolves.toBe(true);
    expect(mockGetDashboardsInfo).toHaveBeenCalledWith(http, 'ds-1');
    expect(createRequestContextWithDataSourceId).toHaveBeenCalledWith('ds-1');
  });

  it('returns false (global gate) when the feature flag is disabled, even if the type is registered', async () => {
    mockGetDashboardsInfo.mockResolvedValue({ resource_sharing_enabled: false });
    mockHttpGetWithQuery.mockResolvedValue({ types: [{ type: 'anomaly-detector' }] });
    await expect(isResourceSharingAvailable(http, 'anomaly-detector', 'ds-1')).resolves.toBe(false);
    // per-type probe should be short-circuited when the global flag is off
    expect(mockHttpGetWithQuery).not.toHaveBeenCalled();
  });

  it('returns false (per-type gate) when enabled but the type is not registered', async () => {
    mockHttpGetWithQuery.mockResolvedValue({ types: [{ type: 'monitor' }] });
    await expect(isResourceSharingAvailable(http, 'anomaly-detector', 'ds-1')).resolves.toBe(false);
  });

  it('returns false (fail-closed) when the dashboards-info probe throws', async () => {
    mockGetDashboardsInfo.mockRejectedValue(new Error('dashboardsinfo unavailable'));
    await expect(isResourceSharingAvailable(http, 'anomaly-detector', 'ds-1')).resolves.toBe(false);
  });

  it('returns false (fail-closed) when the types probe throws', async () => {
    mockHttpGetWithQuery.mockRejectedValue(new Error('resource types endpoint not found'));
    await expect(isResourceSharingAvailable(http, 'anomaly-detector', 'ds-1')).resolves.toBe(false);
  });

  it('returns false when the types response is empty', async () => {
    mockHttpGetWithQuery.mockResolvedValue({});
    await expect(isResourceSharingAvailable(http, 'anomaly-detector')).resolves.toBe(false);
  });

  it('handles a bare array types response (no { types } wrapper)', async () => {
    mockHttpGetWithQuery.mockResolvedValue([{ type: 'anomaly-detector' }, { type: 'forecaster' }]);
    await expect(isResourceSharingAvailable(http, 'forecaster', 'ds-1')).resolves.toBe(true);
    await expect(isResourceSharingAvailable(http, 'monitor', 'ds-1')).resolves.toBe(false);
  });

  it('uses the local cluster context when no data source id is provided', async () => {
    mockHttpGetWithQuery.mockResolvedValue({ types: [{ type: 'forecaster' }] });
    await expect(isResourceSharingAvailable(http, 'forecaster')).resolves.toBe(true);
    expect(mockGetDashboardsInfo).toHaveBeenCalledWith(http, undefined);
    expect(createLocalClusterRequestContext).toHaveBeenCalled();
  });
});
