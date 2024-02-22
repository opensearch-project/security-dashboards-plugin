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

import { httpServerMock } from '../../../../../../src/core/server/http/http_server.mocks';

import { SecurityPluginConfigType } from '../../../index';
import { SecuritySessionCookie } from '../../../session/security_cookie';
import {
  IRouter,
  CoreSetup,
  ILegacyClusterClient,
  Logger,
  SessionStorageFactory,
} from '../../../../../../src/core/server';
import { ProxyAuthentication } from './proxy_auth';

describe('Proxy auth tests', () => {
  let router: IRouter;
  let core: CoreSetup;
  let esClient: ILegacyClusterClient;
  let sessionStorageFactory: SessionStorageFactory<SecuritySessionCookie>;
  let logger: Logger;

  const config = ({
    session: {
      ttl: 1000,
    },
  } as unknown) as SecurityPluginConfigType;

  test('getKeepAliveExpiry', () => {
    const realDateNow = Date.now.bind(global.Date);
    const dateNowStub = jest.fn(() => 0);
    global.Date.now = dateNowStub;
    const proxyAuthentication = new ProxyAuthentication(
      config,
      sessionStorageFactory,
      router,
      esClient,
      core,
      logger
    );

    const cookie: SecuritySessionCookie = {
      credentials: {
        authHeaderValueExtra: true,
      },
      expiryTime: 0,
    };

    const request = httpServerMock.createOpenSearchDashboardsRequest({
      path: '/internal/v1',
    });

    expect(proxyAuthentication.getKeepAliveExpiry(cookie, request)).toBe(1000);
    global.Date.now = realDateNow;
  });
});
