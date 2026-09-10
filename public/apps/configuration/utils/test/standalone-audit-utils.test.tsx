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

import { getStandaloneAudit, updateStandaloneAudit } from '../standalone-audit-utils';
import * as requestUtils from '../request-utils';
import {
  API_ENDPOINT_STANDALONE_AUDIT,
  API_ENDPOINT_STANDALONE_AUDIT_UPDATE,
} from '../../constants';
import { HttpStart } from 'opensearch-dashboards/public';

// The utils layer talks to the cluster through createRequestContextWithDataSourceId().httpGet/httpPost.
// Mock that context so the tests exercise only the flat<->nested translation and value coercion.
jest.mock('../request-utils');

const DATA_SOURCE_ID = 'test-ds';

describe('standalone-audit-utils', () => {
  let httpMock: HttpStart;
  let httpGet: jest.Mock;
  let httpPost: jest.Mock;

  beforeEach(() => {
    httpMock = {} as HttpStart;
    httpGet = jest.fn();
    httpPost = jest.fn();
    (requestUtils.createRequestContextWithDataSourceId as jest.Mock).mockReturnValue({
      httpGet,
      httpPost,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getStandaloneAudit', () => {
    it('reads dynamic audit config from cluster settings into the nested UI shape', async () => {
      httpGet.mockResolvedValue({
        persistent: {
          'plugins.security.audit.enabled': 'true',
          'plugins.security.audit.config.log_request_body': 'false',
          'plugins.security.audit.config.ignore_users': ['kibanaserver', 'admin'],
          'plugins.security.audit.compliance.enabled': 'true',
          'plugins.security.audit.compliance.write_watched_indices': ['logs-*'],
        },
      });

      const result = await getStandaloneAudit(httpMock, DATA_SOURCE_ID);

      expect(result).toEqual({
        enabled: true,
        audit: {
          log_request_body: false,
          ignore_users: ['kibanaserver', 'admin'],
        },
        compliance: {
          enabled: true,
          write_watched_indices: ['logs-*'],
        },
      });
      // Reads through the standalone-audit proxy route with the correct data source.
      expect(requestUtils.createRequestContextWithDataSourceId).toHaveBeenCalledWith(
        DATA_SOURCE_ID
      );
      expect(httpGet).toHaveBeenCalledWith({ http: httpMock, url: API_ENDPOINT_STANDALONE_AUDIT });
    });

    it('coerces real booleans as well as the "true"/"false" strings _cluster/settings returns', async () => {
      httpGet.mockResolvedValue({
        persistent: {
          'plugins.security.audit.enabled': true, // native bool
          'plugins.security.audit.config.log_request_body': 'false', // stringified bool
        },
      });

      const result = await getStandaloneAudit(httpMock, DATA_SOURCE_ID);

      expect(result.enabled).toBe(true);
      expect(result.audit?.log_request_body).toBe(false);
    });

    it('parses list settings represented as a comma-separated string', async () => {
      httpGet.mockResolvedValue({
        persistent: {
          'plugins.security.audit.config.ignore_users': 'kibanaserver, admin ,metrics',
        },
      });

      const result = await getStandaloneAudit(httpMock, DATA_SOURCE_ID);

      // Split, trimmed, and blanks dropped.
      expect(result.audit?.ignore_users).toEqual(['kibanaserver', 'admin', 'metrics']);
    });

    it('parses list settings represented as indexed keys (key.0, key.1, ...)', async () => {
      httpGet.mockResolvedValue({
        persistent: {
          'plugins.security.audit.config.ignore_requests.0': 'GET /_cat*',
          'plugins.security.audit.config.ignore_requests.1': 'indices:data/read*',
        },
      });

      const result = await getStandaloneAudit(httpMock, DATA_SOURCE_ID);

      expect(result.audit?.ignore_requests).toEqual(['GET /_cat*', 'indices:data/read*']);
    });

    it('merges sections so transient overrides persistent overrides defaults', async () => {
      httpGet.mockResolvedValue({
        defaults: { 'plugins.security.audit.config.log_request_body': 'false' },
        persistent: { 'plugins.security.audit.config.log_request_body': 'true' },
        transient: { 'plugins.security.audit.config.log_request_body': 'false' },
      });

      const result = await getStandaloneAudit(httpMock, DATA_SOURCE_ID);

      // transient wins.
      expect(result.audit?.log_request_body).toBe(false);
    });

    it('omits settings that are absent or uncoercible rather than emitting undefined keys', async () => {
      httpGet.mockResolvedValue({
        persistent: {
          'plugins.security.audit.enabled': 'not-a-bool',
        },
      });

      const result = await getStandaloneAudit(httpMock, DATA_SOURCE_ID);

      expect(result).toEqual({});
    });

    it('returns an empty config when the cluster returns no settings', async () => {
      httpGet.mockResolvedValue(undefined);

      const result = await getStandaloneAudit(httpMock, DATA_SOURCE_ID);

      expect(result).toEqual({});
    });
  });

  describe('updateStandaloneAudit', () => {
    it('translates the nested UI config into flat persistent cluster settings', async () => {
      httpPost.mockResolvedValue({ acknowledged: true });

      await updateStandaloneAudit(
        httpMock,
        {
          enabled: true,
          audit: {
            log_request_body: false,
            ignore_users: ['kibanaserver'],
          },
          compliance: {
            enabled: true,
            write_watched_indices: ['logs-*'],
          },
        },
        DATA_SOURCE_ID
      );

      expect(httpPost).toHaveBeenCalledWith({
        http: httpMock,
        url: API_ENDPOINT_STANDALONE_AUDIT_UPDATE,
        body: {
          persistent: {
            'plugins.security.audit.enabled': true,
            'plugins.security.audit.config.log_request_body': false,
            'plugins.security.audit.config.ignore_users': ['kibanaserver'],
            'plugins.security.audit.compliance.enabled': true,
            'plugins.security.audit.compliance.write_watched_indices': ['logs-*'],
          },
        },
      });
    });

    it('only sends the keys present in the update object', async () => {
      httpPost.mockResolvedValue({ acknowledged: true });

      await updateStandaloneAudit(httpMock, { audit: { log_request_body: true } }, DATA_SOURCE_ID);

      const body = httpPost.mock.calls[0][0].body;
      expect(body.persistent).toEqual({
        'plugins.security.audit.config.log_request_body': true,
      });
    });

    it('sends false and empty-array values (they are defined, not omitted)', async () => {
      httpPost.mockResolvedValue({ acknowledged: true });

      await updateStandaloneAudit(
        httpMock,
        { enabled: false, audit: { ignore_users: [] } },
        DATA_SOURCE_ID
      );

      const body = httpPost.mock.calls[0][0].body;
      expect(body.persistent['plugins.security.audit.enabled']).toBe(false);
      expect(body.persistent['plugins.security.audit.config.ignore_users']).toEqual([]);
    });
  });
});
