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

import { logout, externalLogout } from './utils';

jest.mock('../../utils/storage-utils', () => ({ setShouldShowTenantPopup: jest.fn() }));
jest.mock('../configuration/utils/request-utils', () => ({
  createLocalClusterRequestContext: () => ({ httpPost: jest.fn().mockResolvedValue({}) }),
}));

describe('explicit logout destination', () => {
  const windowDescriptor = Object.getOwnPropertyDescriptor(global, 'window');
  const storageDescriptor = Object.getOwnPropertyDescriptor(global, 'sessionStorage');
  let location: any;

  beforeEach(() => {
    location = {
      pathname: '/osd/app/discover',
      search: '?security_tenant=team',
      hash: '#/view/saved?_a=(query:test)',
      assign: jest.fn(),
    };
    Object.defineProperty(global, 'window', { configurable: true, value: { location } });
    Object.defineProperty(global, 'sessionStorage', {
      configurable: true,
      value: { clear: jest.fn() },
    });
  });

  afterEach(() => {
    if (windowDescriptor) Object.defineProperty(global, 'window', windowDescriptor);
    else delete (global as any).window;
    if (storageDescriptor) Object.defineProperty(global, 'sessionStorage', storageDescriptor);
    else delete (global as any).sessionStorage;
  });

  test('Basic logout preserves the full destination and disables automatic login', async () => {
    await logout({ basePath: { serverBasePath: '/osd' } } as any);
    const redirect = new URL(location.assign.mock.calls[0][0], 'https://dashboards.example');
    expect(redirect.pathname).toBe('/osd/app/login');
    expect(redirect.searchParams.get('auto_login')).toBe('false');
    expect(redirect.searchParams.get('nextUrl')).toBe(
      location.pathname + location.search + location.hash
    );
    expect(sessionStorage.clear).toHaveBeenCalled();
  });

  test.each(['/auth/openid/logout', '/auth/saml/logout'])(
    'passes the destination to %s',
    async (endpoint) => {
      await externalLogout({ basePath: { serverBasePath: '/osd' } } as any, endpoint);
      const redirect = new URL(location.assign.mock.calls[0][0], 'https://dashboards.example');
      expect(redirect.pathname).toBe('/osd' + endpoint);
      expect(redirect.searchParams.get('nextUrl')).toBe(
        location.pathname + location.search + location.hash
      );
      expect(sessionStorage.clear).toHaveBeenCalled();
    }
  );

  test('preserves an explicitly configured Basic logout URL', async () => {
    await logout({ basePath: { serverBasePath: '' } } as any, 'https://example.org/logged-out');
    expect(location.assign).toHaveBeenCalledWith('https://example.org/logged-out');
  });
});
