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

import { shallow } from 'enzyme';
import React from 'react';
import { AccountNavButton, reloadAfterTenantSwitch } from '../account-nav-button';
import { getShouldShowTenantPopup, setShouldShowTenantPopup } from '../../../utils/storage-utils';

jest.mock('../../../utils/storage-utils', () => ({
  getShouldShowTenantPopup: jest.fn(),
  setShouldShowTenantPopup: jest.fn(),
}));

describe('Account navigation button', () => {
  const mockCoreStart = {
    http: 1,
  };

  const config = {
    multitenancy: {
      enabled: 'true',
      tenants: {
        enable_private: 'true',
        enable_global: 'true',
      },
    },
    auth: {
      type: 'dummy',
    },
  };

  const userName = 'user1';

  let component;
  const setState = jest.fn();
  const useStateSpy = jest.spyOn(React, 'useState');

  beforeEach(() => {
    useStateSpy.mockImplementation((init) => [init, setState]);
    component = shallow(
      <AccountNavButton
        coreStart={mockCoreStart}
        isInternalUser={true}
        username={userName}
        tenant="tenant1"
        config={config as any}
      />
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders', () => {
    expect(component).toMatchSnapshot();
  });

  it('should set modal when show popup is true', () => {
    (getShouldShowTenantPopup as jest.Mock).mockReturnValueOnce(true);
    shallow(
      <AccountNavButton
        coreStart={mockCoreStart}
        isInternalUser={true}
        username={userName}
        tenant="tenant1"
        config={config as any}
      />
    );
    expect(setState).toBeCalledTimes(1);
  });

  it('should set modal when click on "View roles and identities" button', () => {
    component.find('[data-test-subj="view-roles-and-identities"]').simulate('click');
    expect(setState).toBeCalledTimes(1);
  });

  it('should set modal when click on "Switch tenants" button', () => {
    component.find('[data-test-subj="switch-tenants"]').simulate('click');
    expect(setState).toBeCalledTimes(1);
  });

  it('should set modal when click on "Reset password" button', () => {
    component.find('[data-test-subj="reset-password"]').simulate('click');
    expect(setState).toBeCalledTimes(1);
  });

  it('should set isPopoverOpen to true when click on Avatar in header section', () => {
    component.find('[data-test-subj="account-popover"]').simulate('click');
    expect(setState).toBeCalledTimes(1);
  });
});

describe('Reload window after tenant switch', () => {
  const originalLocation = window.location;
  const mockSetWindowHref = jest.fn();
  let pathname: string = '';
  beforeAll(() => {
    pathname = '/app/myapp';
    Object.defineProperty(window, 'location', {
      value: {
        get pathname() {
          return pathname;
        },
        get href() {
          return '/app/dashboards?security_tenant=admin_tenant';
        },
        set href(value: string) {
          mockSetWindowHref(value);
        },
      },
    });
  });

  afterAll(() => {
    window.location = originalLocation;
  });

  it('should remove the tenant query parameter before reloading', () => {
    pathname = '/app/pathname-only';
    reloadAfterTenantSwitch();
    expect(mockSetWindowHref).toHaveBeenCalledWith(pathname);
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
