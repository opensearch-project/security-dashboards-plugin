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

import { reloadAfterTenantSwitch } from '../account-nav-button';

describe('Reload window after tenant switch', () => {
  it('should remove the tenant query parameter before reloading', () => {
    // jest-location-mock: reloadAfterTenantSwitch() calls window.location.assign(pathname).
    window.location.assign('http://localhost:5601/app/pathname-only?security_tenant=admin_tenant');
    const assignSpy = jest.spyOn(window.location, 'assign');
    reloadAfterTenantSwitch();
    expect(assignSpy).toHaveBeenCalledWith('/app/pathname-only');
  });
});

describe('Clear lastUrls after tenant switch', () => {
  afterAll(() => {
    jest.clearAllMocks();
  });

  it('should clear out keys with a lastUrl prefix', () => {
    window.sessionStorage.setItem('lastUrl:dashboard', '/dashboard1');
    window.sessionStorage.setItem('lastUrl:otherApp', '/otherApp');
    window.sessionStorage.setItem('somethingElse:here', '/random');
    const mockRemoveItem = jest.spyOn(Object.getPrototypeOf(window.sessionStorage), 'removeItem');
    reloadAfterTenantSwitch();
    expect(mockRemoveItem).toHaveBeenCalledWith('lastUrl:dashboard');
    expect(mockRemoveItem).toHaveBeenCalledWith('lastUrl:otherApp');
    expect(mockRemoveItem).toHaveBeenCalledTimes(2);
  });

  it('should not clear out keys without a lastUrl prefix', () => {
    window.sessionStorage.setItem('somethingElse:here', '/random');
    const mockRemoveItem = jest.spyOn(Object.getPrototypeOf(window.sessionStorage), 'removeItem');

    reloadAfterTenantSwitch();
    expect(mockRemoveItem).toHaveBeenCalledTimes(0);
  });
});
