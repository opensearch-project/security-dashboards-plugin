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

import { isResourceSharingAvailable } from '../resource-sharing-utils';
import {
  createRequestContextWithDataSourceId,
  createLocalClusterRequestContext,
} from '../../apps/configuration/utils/request-utils';

const http = {} as any;

// Route the two probes (feature flag + types) by URL.
const respond = (enabled: boolean, typesResponse: any) => (_http: any, url: string) => {
  if (url.includes('resource_sharing_enabled')) return Promise.resolve({ enabled });
  if (url.includes('resource/types')) return Promise.resolve(typesResponse);
  return Promise.resolve({});
};

describe('isResourceSharingAvailable', () => {
  afterEach(() => {
    mockHttpGetWithQuery.mockReset();
    (createRequestContextWithDataSourceId as jest.Mock).mockClear();
    (createLocalClusterRequestContext as jest.Mock).mockClear();
  });

  it('returns true when the feature is enabled and the type is registered', async () => {
    mockHttpGetWithQuery.mockImplementation(
      respond(true, { types: [{ type: 'anomaly-detector' }, { type: 'monitor' }] })
    );
    await expect(isResourceSharingAvailable(http, 'anomaly-detector', 'ds-1')).resolves.toBe(true);
    expect(createRequestContextWithDataSourceId).toHaveBeenCalledWith('ds-1');
  });

  it('returns false (global gate) when the feature flag is disabled, even if the type is registered', async () => {
    mockHttpGetWithQuery.mockImplementation(
      respond(false, { types: [{ type: 'anomaly-detector' }] })
    );
    await expect(isResourceSharingAvailable(http, 'anomaly-detector', 'ds-1')).resolves.toBe(false);
    // the types probe is skipped once the flag is off
    expect(mockHttpGetWithQuery).toHaveBeenCalledTimes(1);
  });

  it('returns false (per-type gate) when enabled but the type is not registered', async () => {
    mockHttpGetWithQuery.mockImplementation(respond(true, { types: [{ type: 'monitor' }] }));
    await expect(isResourceSharingAvailable(http, 'anomaly-detector', 'ds-1')).resolves.toBe(false);
  });

  it('returns false (fail-closed) when a probe throws', async () => {
    mockHttpGetWithQuery.mockRejectedValue(new Error('boom'));
    await expect(isResourceSharingAvailable(http, 'anomaly-detector', 'ds-1')).resolves.toBe(false);
  });

  it('handles a bare array types response (no { types } wrapper)', async () => {
    mockHttpGetWithQuery.mockImplementation(respond(true, [{ type: 'forecaster' }]));
    await expect(isResourceSharingAvailable(http, 'forecaster', 'ds-1')).resolves.toBe(true);
    await expect(isResourceSharingAvailable(http, 'monitor', 'ds-1')).resolves.toBe(false);
  });

  it('uses the local cluster context when no data source id is provided', async () => {
    mockHttpGetWithQuery.mockImplementation(respond(true, { types: [{ type: 'forecaster' }] }));
    await expect(isResourceSharingAvailable(http, 'forecaster')).resolves.toBe(true);
    expect(createLocalClusterRequestContext).toHaveBeenCalled();
  });
});
