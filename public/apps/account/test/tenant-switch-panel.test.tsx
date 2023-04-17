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
import { fetchAccountInfo } from '../utils';
import { getDashboardsInfo } from '../../../utils/dashboards-info-utils';
import {
  CUSTOM_TENANT_RADIO_ID,
  GLOBAL_TENANT_RADIO_ID,
  PRIVATE_TENANT_RADIO_ID,
  TenantSwitchPanel,
} from '../tenant-switch-panel';
import { selectTenant } from '../../configuration/utils/tenant-utils';
import { constructErrorMessageAndLog } from '../../error-utils';
import { keys } from 'lodash';

const mockAccountInfo = {
  data: {
    tenants: {
      ['tenant1']: true,
      ['global_tenant']: true,
      ['user1']: true,
    },
    user_name: 'user1',
    roles: ['readall', 'readonly'],
    user_requested_tenant: '',
  },
};

const mockDashboardsInfo = {
  multitenancy_enabled: true,
  private_tenant_enabled: true,
  default_tenant: '',
};

jest.mock('../utils', () => ({
  fetchAccountInfo: jest.fn().mockImplementation(() => {
    return mockAccountInfo;
  }),
}));

jest.mock('../../../utils/dashboards-info-utils', () => ({
  getDashboardsInfo: jest.fn().mockImplementation(() => {
    return mockDashboardsInfo;
  }),
}));

jest.mock('../../configuration/utils/tenant-utils', () => ({
  ...jest.requireActual('../../configuration/utils/tenant-utils'),
  selectTenant: jest.fn(),
}));

jest.mock('../../error-utils', () => ({
  constructErrorMessageAndLog: jest.fn(),
}));

describe('Account menu -tenant switch panel', () => {
  const setState = jest.fn();
  const mockCoreStart = {
    http: 1,
  };
  const handleClose = jest.fn();
  const handleSwitchAndClose = jest.fn();
  const defaultConfig = {
    multitenancy: {
      enabled: true,
      tenants: {
        enable_private: true,
        enable_global: true,
      },
    },
  };
  const useEffect = jest.spyOn(React, 'useEffect');
  const useState = jest.spyOn(React, 'useState');

  beforeEach(() => {
    useEffect.mockImplementationOnce((f) => f());
    useState.mockImplementation((initialValue) => [initialValue, setState]);
    (getDashboardsInfo as jest.Mock).mockImplementation(() => {
      return mockDashboardsInfo;
    });
  });

  it('fetch data when user requested tenant is Global', (done) => {
    (getDashboardsInfo as jest.Mock).mockImplementation(() => {
      return mockDashboardsInfo;
    });
    shallow(
      <TenantSwitchPanel
        coreStart={mockCoreStart as any}
        handleClose={handleClose}
        handleSwitchAndClose={handleSwitchAndClose}
        config={defaultConfig as any}
      />
    );

    process.nextTick(() => {
      expect(fetchAccountInfo).toHaveBeenCalledTimes(1);
      expect(setState).toHaveBeenCalledWith(keys(mockAccountInfo.data.tenants));
      expect(setState).toHaveBeenCalledWith(mockAccountInfo.data.user_name);
      expect(setState).toHaveBeenCalledWith(GLOBAL_TENANT_RADIO_ID);
      done();
    });
  });

  it('fetch data when user requested tenant is Private', (done) => {
    (getDashboardsInfo as jest.Mock).mockImplementation(() => {
      return mockDashboardsInfo;
    });
    (fetchAccountInfo as jest.Mock).mockImplementationOnce(() => {
      return {
        data: {
          tenants: {
            ['tenant1']: true,
          },
          user_name: 'user1',
          roles: ['role1', 'role2'],
          user_requested_tenant: '__user__',
        },
      };
    });
    shallow(
      <TenantSwitchPanel
        coreStart={mockCoreStart as any}
        handleClose={handleClose}
        handleSwitchAndClose={handleSwitchAndClose}
        config={defaultConfig as any}
      />
    );

    process.nextTick(() => {
      expect(setState).toHaveBeenCalledWith(PRIVATE_TENANT_RADIO_ID);
      done();
    });
  });

  it('fetch data when user requested tenant is Custom', (done) => {
    (getDashboardsInfo as jest.Mock).mockImplementation(() => {
      return mockDashboardsInfo;
    });
    (fetchAccountInfo as jest.Mock).mockImplementationOnce(() => {
      return {
        data: {
          tenants: {
            ['tenant1']: true,
          },
          user_name: 'user1',
          roles: ['role1', 'role2'],
          user_requested_tenant: 'tenant1',
        },
      };
    });
    shallow(
      <TenantSwitchPanel
        coreStart={mockCoreStart as any}
        handleClose={handleClose}
        handleSwitchAndClose={handleSwitchAndClose}
        config={defaultConfig as any}
      />
    );

    process.nextTick(() => {
      expect(setState).toHaveBeenCalledWith(CUSTOM_TENANT_RADIO_ID);
      expect(setState).toHaveBeenCalledWith([{ label: 'tenant1' }]);
      done();
    });
  });

  it('error occurred while fetching data', (done) => {
    (getDashboardsInfo as jest.Mock).mockImplementation(() => {
      return mockDashboardsInfo;
    });
    (fetchAccountInfo as jest.Mock).mockImplementationOnce(() => {
      throw new Error();
    });
    const spy = jest.spyOn(console, 'error').mockImplementationOnce(() => {});
    shallow(
      <TenantSwitchPanel
        coreStart={mockCoreStart as any}
        handleClose={handleClose}
        handleSwitchAndClose={handleSwitchAndClose}
        config={defaultConfig as any}
      />
    );
    process.nextTick(() => {
      expect(spy).toHaveBeenCalled();
      done();
    });
  });

  it('handle modal close', () => {
    (getDashboardsInfo as jest.Mock).mockImplementation(() => {
      return mockDashboardsInfo;
    });
    const component = shallow(
      <TenantSwitchPanel
        coreStart={mockCoreStart as any}
        handleClose={handleClose}
        handleSwitchAndClose={handleSwitchAndClose}
        config={defaultConfig as any}
      />
    );
    component.find('[data-test-subj="tenant-switch-modal"]').simulate('close');
    expect(handleClose).toBeCalled();
  });

  it('Confirm button should be disabled when multitenancy is disabled in Config', () => {
    (getDashboardsInfo as jest.Mock).mockImplementation(() => {
      return {
        multitenancy_enabled: false,
        private_tenant_enabled: true,
        default_tenant: '',
      };
    });
    const config = {
      multitenancy: {
        enabled: false,
        tenants: {
          enable_private: true,
          enable_global: true,
        },
      },
    };
    const component = shallow(
      <TenantSwitchPanel
        coreStart={mockCoreStart as any}
        handleClose={handleClose}
        handleSwitchAndClose={handleSwitchAndClose}
        config={config as any}
      />
    );
    process.nextTick(() => {
      const confirmButton = component.find('[data-test-subj="confirm"]');
      expect(confirmButton.prop('disabled')).toBe(true);
    });
  });

  it('selected radio id should be change on onChange event', () => {
    (getDashboardsInfo as jest.Mock).mockImplementation(() => {
      return mockDashboardsInfo;
    });
    const component = shallow(
      <TenantSwitchPanel
        coreStart={mockCoreStart as any}
        handleClose={handleClose}
        handleSwitchAndClose={handleSwitchAndClose}
        config={defaultConfig as any}
      />
    );
    component
      .find('[data-test-subj="tenant-switch-radios"]')
      .simulate('change', GLOBAL_TENANT_RADIO_ID);

    expect(setState).toBeCalledWith(GLOBAL_TENANT_RADIO_ID);
    expect(setState).toBeCalledWith('');
  });

  it('should set error call out when tenant name is undefined', () => {
    (getDashboardsInfo as jest.Mock).mockImplementation(() => {
      return mockDashboardsInfo;
    });
    const component = shallow(
      <TenantSwitchPanel
        coreStart={mockCoreStart as any}
        handleClose={handleClose}
        handleSwitchAndClose={handleSwitchAndClose}
        config={defaultConfig as any}
      />
    );
    component.find('[data-test-subj="confirm"]').simulate('click');
    expect(setState).toBeCalledWith('No target tenant is specified!');
  });

  describe('confirm button and renders', () => {
    beforeEach(() => {
      useState.mockImplementationOnce(() => [keys(mockAccountInfo.data.tenants), setState]);
      useState.mockImplementationOnce(() => [mockAccountInfo.data.user_name, setState]);
    });

    it('should handle tenant confirmation on "confirm" button click when selected tenant is Global tenant', () => {
      useState.mockImplementationOnce(() => [[], setState]);
      useState.mockImplementationOnce(() => ['', setState]);
      useState.mockImplementationOnce(() => [GLOBAL_TENANT_RADIO_ID, setState]);
      useState.mockImplementationOnce(() => ['', setState]);
      const component = shallow(
        <TenantSwitchPanel
          coreStart={mockCoreStart as any}
          handleClose={handleClose}
          handleSwitchAndClose={handleSwitchAndClose}
          config={defaultConfig as any}
        />
      );
      component.find('[data-test-subj="confirm"]').simulate('click');
      expect(selectTenant).toHaveBeenCalledTimes(1);
    });

    it('should handle tenant confirmation on "confirm" button click when selected tenant is Private tenant', () => {
      useState.mockImplementationOnce(() => [[], setState]);
      useState.mockImplementationOnce(() => ['', setState]);
      useState.mockImplementationOnce(() => [PRIVATE_TENANT_RADIO_ID, setState]);
      useState.mockImplementationOnce(() => ['', setState]);
      const component = shallow(
        <TenantSwitchPanel
          coreStart={mockCoreStart as any}
          handleClose={handleClose}
          handleSwitchAndClose={handleSwitchAndClose}
          config={defaultConfig as any}
        />
      );
      component.find('[data-test-subj="confirm"]').simulate('click');
      expect(selectTenant).toHaveBeenCalledTimes(1);
    });

    it('should handle tenant confirmation on "confirm" button click when selected tenant is Custom tenant', () => {
      useState.mockImplementationOnce(() => [[], setState]);
      useState.mockImplementationOnce(() => ['', setState]);
      useState.mockImplementationOnce(() => [CUSTOM_TENANT_RADIO_ID, setState]);
      useState.mockImplementationOnce(() => [[{ label: 'tenant1' }], setState]);
      const component = shallow(
        <TenantSwitchPanel
          coreStart={mockCoreStart as any}
          handleClose={handleClose}
          handleSwitchAndClose={handleSwitchAndClose}
          config={defaultConfig as any}
        />
      );
      component.find('[data-test-subj="confirm"]').simulate('click');
      expect(selectTenant).toHaveBeenCalledTimes(1);
    });

    it('should set error call out when error occurred while changing the tenant', (done) => {
      useState.mockImplementationOnce(() => [[], setState]);
      useState.mockImplementationOnce(() => ['', setState]);
      useState.mockImplementationOnce(() => [GLOBAL_TENANT_RADIO_ID, setState]);
      useState.mockImplementationOnce(() => ['', setState]);
      (selectTenant as jest.Mock).mockImplementationOnce(() => {
        throw Error();
      });
      const component = shallow(
        <TenantSwitchPanel
          coreStart={mockCoreStart as any}
          handleClose={handleClose}
          handleSwitchAndClose={handleSwitchAndClose}
          config={defaultConfig as any}
        />
      );
      component.find('[data-test-subj="confirm"]').simulate('click');
      process.nextTick(() => {
        expect(constructErrorMessageAndLog).toHaveBeenCalledTimes(1);
        done();
      });
    });

    it('renders when both global and private tenant enabled', () => {
      (getDashboardsInfo as jest.Mock).mockImplementation(() => {
        return mockDashboardsInfo;
      });
      const component = shallow(
        <TenantSwitchPanel
          coreStart={mockCoreStart as any}
          handleClose={handleClose}
          handleSwitchAndClose={handleSwitchAndClose}
          config={defaultConfig as any}
        />
      );
      expect(component).toMatchSnapshot();
    });

    it('renders when global tenant disabled', () => {
      (getDashboardsInfo as jest.Mock).mockImplementation(() => {
        return mockDashboardsInfo;
      });
      const config = {
        multitenancy: {
          enabled: true,
          tenants: {
            enable_private: true,
            enable_global: false,
          },
        },
      };
      const component = shallow(
        <TenantSwitchPanel
          coreStart={mockCoreStart as any}
          handleClose={handleClose}
          handleSwitchAndClose={handleSwitchAndClose}
          config={config as any}
        />
      );
      expect(component).toMatchSnapshot();
    });

    it('renders when private tenant disabled', () => {
      (getDashboardsInfo as jest.Mock).mockImplementation(() => {
        return {
          multitenancy_enabled: true,
          private_tenant_enabled: false,
          default_tenant: '',
        };
      });
      const config = {
        multitenancy: {
          enabled: true,
          tenants: {
            enable_private: false,
            enable_global: true,
          },
        },
      };
      const component = shallow(
        <TenantSwitchPanel
          coreStart={mockCoreStart as any}
          handleClose={handleClose}
          handleSwitchAndClose={handleSwitchAndClose}
          config={config as any}
        />
      );
      expect(component).toMatchSnapshot();
    });

    it('renders when user has read only role', () => {
      (getDashboardsInfo as jest.Mock).mockImplementation(() => {
        return mockDashboardsInfo;
      });
      useState.mockImplementationOnce(() => [['readonly'], setState]);
      useState.mockImplementationOnce(() => ['', setState]);
      const config = {
        readonly_mode: {
          roles: ['readonly'],
        },
        multitenancy: {
          enabled: true,
          tenants: {
            enable_private: true,
            enable_global: true,
          },
        },
      };
      const component = shallow(
        <TenantSwitchPanel
          coreStart={mockCoreStart as any}
          handleClose={handleClose}
          handleSwitchAndClose={handleSwitchAndClose}
          config={config as any}
        />
      );
      expect(component).toMatchSnapshot();
    });

    it('renders when user has default read only role', () => {
      (getDashboardsInfo as jest.Mock).mockImplementation(() => {
        return mockDashboardsInfo;
      });
      useState.mockImplementationOnce(() => [['kibana_read_only'], setState]);
      useState.mockImplementationOnce(() => ['', setState]);
      const config = {
        readonly_mode: {
          roles: [],
        },
        multitenancy: {
          enabled: true,
          tenants: {
            enable_private: true,
            enable_global: true,
          },
        },
      };
      const component = shallow(
        <TenantSwitchPanel
          coreStart={mockCoreStart as any}
          handleClose={handleClose}
          handleSwitchAndClose={handleSwitchAndClose}
          config={config as any}
        />
      );
      expect(component).toMatchSnapshot();
    });
  });
});
