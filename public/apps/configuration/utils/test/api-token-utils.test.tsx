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

import {
  listApiTokens,
  createApiToken,
  revokeApiToken,
  requestRevokeApiTokens,
} from '../api-token-utils';

const mockHttpGet = jest.fn();
const mockHttpPost = jest.fn();
const mockHttpDelete = jest.fn();

jest.mock('../request-utils', () => ({
  createRequestContextWithDataSourceId: () => ({
    httpGet: (opts: any) => mockHttpGet(opts),
    httpPost: (opts: any) => mockHttpPost(opts),
    httpDelete: (opts: any) => mockHttpDelete(opts),
  }),
}));

describe('api-token-utils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('listApiTokens', () => {
    it('calls httpGet with correct url', async () => {
      mockHttpGet.mockResolvedValue([{ id: '1', name: 'test' }]);
      const result = await listApiTokens({} as any, 'ds1');
      expect(mockHttpGet).toHaveBeenCalledWith(
        expect.objectContaining({ url: expect.stringContaining('apitokens') })
      );
      expect(result).toEqual([{ id: '1', name: 'test' }]);
    });
  });

  describe('createApiToken', () => {
    it('calls httpPost with request body', async () => {
      mockHttpPost.mockResolvedValue({ id: '1', token: 'abc' });
      const body = { name: 'key1', cluster_permissions: [], index_permissions: [] };
      const result = await createApiToken({} as any, body, 'ds1');
      expect(mockHttpPost).toHaveBeenCalledWith(expect.objectContaining({ body }));
      expect(result).toEqual({ id: '1', token: 'abc' });
    });
  });

  describe('revokeApiToken', () => {
    it('calls httpDelete with encoded token id', async () => {
      mockHttpDelete.mockResolvedValue(undefined);
      await revokeApiToken({} as any, 'token/id', 'ds1');
      expect(mockHttpDelete).toHaveBeenCalledWith(
        expect.objectContaining({ url: expect.stringContaining('token%2Fid') })
      );
    });
  });

  describe('requestRevokeApiTokens', () => {
    it('revokes each token in sequence', async () => {
      mockHttpDelete.mockResolvedValue(undefined);
      await requestRevokeApiTokens({} as any, ['id1', 'id2', 'id3'], 'ds1');
      expect(mockHttpDelete).toHaveBeenCalledTimes(3);
    });

    it('handles empty array', async () => {
      await requestRevokeApiTokens({} as any, [], 'ds1');
      expect(mockHttpDelete).not.toHaveBeenCalled();
    });
  });
});
