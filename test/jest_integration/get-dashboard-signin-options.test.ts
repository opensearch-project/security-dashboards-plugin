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

import { Root } from '../../../../src/core/server/root';
import * as osdTestServer from '../../../../src/core/test_helpers/osd_server';
import { afterAll, beforeAll, describe, expect, it } from '@jest/globals';
import { resolve } from 'path';

import {
  AUTHORIZATION_HEADER_NAME,
  OPENSEARCH_DASHBOARDS_SERVER_PASSWORD,
  OPENSEARCH_DASHBOARDS_SERVER_USER,
} from '../constant';
import { API_ENDPOINT_DASHBOARD_SIGNIN_OPTIONS } from '../../common';
import { DashboardSignInOptions } from '../../public/apps/configuration/types';

describe('start OpenSearch Dashboards server', () => {
  let root: Root;

  beforeAll(async () => {
    root = osdTestServer.createRootWithSettings(
      {
        plugins: {
          scanDirs: [resolve(__dirname, '../..')],
        },
        opensearch: {
          hosts: ['https://localhost:9200'],
          ignoreVersionMismatch: true,
          ssl: { verificationMode: 'none' },
          username: OPENSEARCH_DASHBOARDS_SERVER_USER,
          password: OPENSEARCH_DASHBOARDS_SERVER_PASSWORD,
        },
        opensearch_security: {
          multitenancy: { enabled: true, tenants: { preferred: ['Private', 'Global'] } },
        },
      },
      {
        // to make ignoreVersionMismatch setting work
        // can be removed when we have corresponding ES version
        dev: true,
      }
    );

    console.log('Starting OpenSearchDashboards server..');
    await root.setup();
    await root.start();
    console.log('Started OpenSearchDashboards server');
  });

  afterAll(async () => {
    // shutdown OpenSearchDashboards server
    await root.shutdown();
  });

  it(`get ${API_ENDPOINT_DASHBOARD_SIGNIN_OPTIONS} should return all dashboard sign-in options from backend.`, async () => {
    const response = await osdTestServer.request
      .get(root, API_ENDPOINT_DASHBOARD_SIGNIN_OPTIONS)
      .unset(AUTHORIZATION_HEADER_NAME);

    expect(response.status).toEqual(200);
    expect(response.text).toContain(DashboardSignInOptions[DashboardSignInOptions.BASIC]);
    expect(JSON.parse(response.text)).toBeInstanceOf(Array);
  });
});
