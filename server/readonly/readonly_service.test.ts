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

import { loggerMock } from '@osd/logging/target/mocks';
import { httpServerMock, sessionStorageMock } from '../../../../src/core/server/mocks';
import { ILegacyClusterClient } from '../../../../src/core/server/opensearch/legacy/cluster_client';
import { PRIVATE_TENANT_SYMBOL } from '../../common/index';
import { OpenSearchAuthInfo } from '../auth/types/authentication_type';
import { BasicAuthentication } from '../auth/types/index';
import { SecurityClient } from '../backend/opensearch_security_client';
import { SecurityPluginConfigType } from '../index';
import { SecuritySessionCookie } from '../session/security_cookie';
import { ReadonlyService } from './readonly_service';

jest.mock('../auth/types/basic/basic_auth');

const mockCookie = (data: Partial<SecuritySessionCookie> = {}): SecuritySessionCookie =>
  Object.assign(
    {
      username: 'test',
      credentials: {
        authHeaderValue: 'Basic cmVhZG9ubHk6Z2FzZGN4ejRRIQ==',
      },
      authType: 'basicauth',
      isAnonymousAuth: false,
      tenant: '__user__',
    },
    data
  );

const mockEsClient = (): jest.Mocked<ILegacyClusterClient> => {
  return {
    callAsInternalUser: jest.fn(),
    asScoped: jest.fn(),
  };
};

const mockAuthInfo = (data: Partial<OpenSearchAuthInfo> = {}): OpenSearchAuthInfo =>
  Object.assign(
    {
      user: '',
      user_name: 'admin',
      user_requested_tenant: PRIVATE_TENANT_SYMBOL,
      remote_address: '127.0.0.1',
      backend_roles: ['admin'],
      custom_attribute_names: [],
      roles: ['own_index', 'all_access'],
      tenants: {
        admin_tenant: true,
        admin: true,
      },
      principal: null,
      peer_certificates: '0',
      sso_logout_url: null,
    },
    data
  );

const mockDashboardsInfo = (data = {}) =>
  Object.assign(
    {
      user_name: 'admin',
      multitenancy_enabled: true,
    },
    data
  );

const getService = (
  cookie: SecuritySessionCookie = mockCookie(),
  authInfo: OpenSearchAuthInfo = mockAuthInfo(),
  dashboardsInfo = mockDashboardsInfo()
) => {
  const logger = loggerMock.create();

  const securityClient = new SecurityClient(mockEsClient());
  securityClient.authinfo = jest.fn().mockReturnValue(authInfo);
  securityClient.dashboardsinfo = jest.fn().mockReturnValue(dashboardsInfo);

  // @ts-ignore mock auth
  const auth = new BasicAuthentication();
  auth.requestIncludesAuthInfo = jest.fn().mockReturnValue(true);

  const securitySessionStorageFactory = sessionStorageMock.createFactory<SecuritySessionCookie>();
  securitySessionStorageFactory.asScoped = jest.fn().mockReturnValue({
    get: jest.fn().mockResolvedValue(cookie),
  });

  const config = {
    multitenancy: {
      enabled: true,
    },
  } as SecurityPluginConfigType;

  return new ReadonlyService(logger, securityClient, auth, securitySessionStorageFactory, config);
};

describe('checks isAnonymousPage', () => {
  const service = getService();

  it.each([
    // Missing referer header
    [
      {
        path: '/api/core/capabilities',
        headers: {},
        auth: {
          isAuthenticated: false,
          mode: 'optional',
        },
      },
      false,
    ],
    // Referer with not anynoumous page
    [
      {
        headers: {
          referer: 'https://localhost/app/management/opensearch-dashboards/indexPatterns',
        },
      },
      false,
    ],
    // Referer with anynoumous page
    [
      {
        path: '/app/login',
        headers: {
          referer: 'https://localhost/app/login',
        },
        routeAuthRequired: false,
      },
      true,
    ],
  ])('%j returns result %s', (requestData, expectedResult) => {
    const request = httpServerMock.createOpenSearchDashboardsRequest(requestData);
    expect(service.isAnonymousPage(request)).toEqual(expectedResult);
  });
});

describe('checks isReadOnlyTenant', () => {
  const service = getService();

  it.each([
    // returns false with private global tenant
    [mockAuthInfo({ user_requested_tenant: PRIVATE_TENANT_SYMBOL }), false],
    // returns false when has requested tenant but it's read and write
    [
      mockAuthInfo({
        user_requested_tenant: 'readonly_tenant',
        tenants: {
          readonly_tenant: true,
        },
      }),
      false,
    ],
    // returns true when has requested tenant and it's read only
    [
      mockAuthInfo({
        user_requested_tenant: 'readonly_tenant',
        tenants: {
          readonly_tenant: false,
        },
      }),
      true,
    ],
  ])('%j returns result %s', (authInfo, expectedResult) => {
    expect(service.isReadOnlyTenant(authInfo)).toBe(expectedResult);
  });
});

describe('checks isReadonly', () => {
  it('calls isAnonymousPage', async () => {
    const service = getService();
    service.isAnonymousPage = jest.fn(() => true);
    await service.isReadonly(httpServerMock.createOpenSearchDashboardsRequest());
    expect(service.isAnonymousPage).toBeCalled();
  });
  it('calls isReadOnlyTenant with correct authinfo', async () => {
    const cookie = mockCookie({ tenant: 'readonly_tenant' });
    const authInfo = mockAuthInfo({
      user_requested_tenant: 'readonly_tenant',
      tenants: {
        readonly_tenant: false,
      },
    });

    const service = getService(cookie, authInfo);
    service.isAnonymousPage = jest.fn(() => false);

    const result = await service.isReadonly(httpServerMock.createOpenSearchDashboardsRequest());
    expect(result).toBeTruthy();
  });
  it('calls dashboardInfo and checks if multitenancy is enabled', async () => {
    const dashboardsInfo = mockDashboardsInfo({ multitenancy_enabled: false });
    const service = getService(mockCookie(), mockAuthInfo(), dashboardsInfo);
    service.isAnonymousPage = jest.fn(() => false);

    const result = await service.isReadonly(httpServerMock.createOpenSearchDashboardsRequest());
    expect(result).toBeFalsy();
  });
});
