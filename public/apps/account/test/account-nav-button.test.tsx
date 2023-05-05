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
import { AccountNavButton } from '../account-nav-button';
import { getShouldShowTenantPopup, setShouldShowTenantPopup } from '../../../utils/storage-utils';
import { getDashboardsInfo } from '../../../utils/dashboards-info-utils';

jest.mock('../../../utils/storage-utils', () => ({
  getShouldShowTenantPopup: jest.fn(),
  setShouldShowTenantPopup: jest.fn(),
}));

jest.mock('../../../utils/dashboards-info-utils', () => ({
  getDashboardsInfo: jest.fn().mockImplementation(() => {
    return mockDashboardsInfo;
  }),
}));

const mockDashboardsInfo = {
  multitenancy_enabled: true,
  private_tenant_enabled: true,
  default_tenant: '',
};

describe('Account navigation button', () => {
  const mockCoreStart = {
    http: 1,
  };

  const config = {
    multitenancy: {
      enabled: true,
      tenants: {
        enable_private: true,
        enable_global: true,
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
    (getDashboardsInfo as jest.Mock).mockImplementation(() => {
      return mockDashboardsInfo;
    });
    component = shallow(
      <AccountNavButton
        coreStart={mockCoreStart}
        isInternalUser={true}
        username={userName}
        tenant="tenant1"
        config={config as any}
        currAuthType={'dummy'}
      />
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders', () => {
    (getDashboardsInfo as jest.Mock).mockImplementationOnce(() => {
      return mockDashboardsInfo;
    });
    expect(component).toMatchSnapshot();
  });

  it('should set modal when show popup is true', () => {
    (getDashboardsInfo as jest.Mock).mockImplementation(() => {
      return mockDashboardsInfo;
    });
    (getShouldShowTenantPopup as jest.Mock).mockReturnValueOnce(true);
    shallow(
      <AccountNavButton
        coreStart={mockCoreStart}
        isInternalUser={true}
        username={userName}
        tenant="tenant1"
        config={config as any}
        currAuthType={'dummy'}
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

describe('Account navigation button, multitenancy disabled', () => {
  const mockCoreStart = {
    http: 1,
  };

  const config = {
    multitenancy: {
      enabled: false,
    },
    auth: {
      type: 'dummy',
    },
  };

  const userName = 'user1';
  const setState = jest.fn();
  const useStateSpy = jest.spyOn(React, 'useState');

  beforeEach(() => {
    useStateSpy.mockImplementation((init) => [init, setState]);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should not set modal when show popup is true', () => {
    (getDashboardsInfo as jest.Mock).mockImplementation(() => {
      return {
        multitenancy_enabled: false,
        private_tenant_enabled: false,
        default_tenant: '',
      };
    });
    (getShouldShowTenantPopup as jest.Mock).mockReturnValueOnce(true);
    shallow(
      <AccountNavButton
        coreStart={mockCoreStart}
        isInternalUser={true}
        username={userName}
        config={config as any}
        currAuthType={'dummy'}
      />
    );
    expect(setState).toBeCalledTimes(0);
  });
});
