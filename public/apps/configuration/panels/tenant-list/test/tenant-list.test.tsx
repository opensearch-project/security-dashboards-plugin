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

import { ManageTab } from '../manage_tab';
import { shallow } from 'enzyme';
import React from 'react';
import { EuiInMemoryTable } from '@elastic/eui';
import { useDeleteConfirmState } from '../../../utils/delete-confirm-modal-utils';
import { Tenant } from '../../../types';
import { TenantEditModal } from '../edit-modal';
import { TenantInstructionView } from '../tenant-instruction-view';
import { getDashboardsInfo } from '../../../../../utils/dashboards-info-utils';

jest.mock('../../../utils/tenant-utils');
jest.mock('../../../../../utils/auth-info-utils');
jest.mock('../../../utils/delete-confirm-modal-utils', () => ({
  useDeleteConfirmState: jest.fn().mockReturnValue([jest.fn(), '']),
}));
jest.mock('../../../utils/context-menu', () => ({
  useContextMenuState: jest
    .fn()
    .mockImplementation((buttonText, buttonProps, children) => [children, jest.fn()]),
}));
jest.mock('../../../utils/toast-utils', () => ({
  useToastState: jest.fn().mockReturnValue([[], jest.fn(), jest.fn()]),
  getSuccessToastMessage: jest.fn(),
  createUnknownErrorToast: jest.fn(),
}));

jest.mock('../../../../../utils/dashboards-info-utils', () => ({
  getDashboardsInfo: jest.fn().mockImplementation(() => {
    return mockDashboardsInfo;
  }),
}));

const mockDashboardsInfo = {
  multitenancy_enabled: true,
  private_tenant_enabled: true,
  default_tenant: '',
};

// eslint-disable-next-line
const mockTenantUtils = require('../../../utils/tenant-utils');
// eslint-disable-next-line
const mockAuthInfoUtils = require('../../../../../utils/auth-info-utils');

describe('Tenant list', () => {
  const setState = jest.fn();
  const mockCoreStart = {
    http: 1,
    chrome: {
      setBreadcrumbs() {
        return 1;
      },
    },
  };
  const config = {
    multitenancy: {
      enabled: true,
      tenants: {
        enable_private: true,
      },
    },
  };

  beforeEach(() => {
    jest.spyOn(React, 'useState').mockImplementation((initialValue) => [initialValue, setState]);
  });

  it('Render empty', () => {
    (getDashboardsInfo as jest.Mock).mockImplementation(() => {
      return mockDashboardsInfo;
    });

    const mockTenantListingData = [
      {
        tenant: 'tenant_1',
        description: '',
        reserved: true,
        tenantValue: 'tenant_1',
      },
    ];

    mockTenantUtils.transformTenantData = jest.fn().mockReturnValue(mockTenantListingData);

    const component = shallow(
      <ManageTab
        coreStart={mockCoreStart as any}
        navigation={{} as any}
        params={{} as any}
        config={config as any}
      />
    );

    expect(component.find(EuiInMemoryTable).prop('items').length).toBe(0);
  });

  it('renders when multitenancy is disabled in the opensearch_dashboards.yml', () => {
    (getDashboardsInfo as jest.Mock).mockImplementation(() => {
      return {
        multitenancy_enabled: false,
        private_tenant_enabled: true,
        default_tenant: '',
      };
    });
    const config1 = {
      multitenancy: {
        enabled: false,
        tenants: {
          enable_private: true,
        },
      },
    };
    const component = shallow(
      <ManageTab
        coreStart={mockCoreStart as any}
        navigation={{} as any}
        params={{} as any}
        config={config1 as any}
      />
    );
    expect(component.find(TenantInstructionView).length).toBe(0);
  });

  it('fetch data error', (done) => {
    jest.spyOn(React, 'useEffect').mockImplementationOnce((f) => f());
    // Hide the error message
    jest.spyOn(console, 'log').mockImplementationOnce(() => {});
    mockTenantUtils.fetchTenants.mockImplementationOnce(() => {
      throw Error();
    });

    shallow(
      <ManageTab
        coreStart={mockCoreStart as any}
        navigation={{} as any}
        params={{} as any}
        config={config as any}
      />
    );

    process.nextTick(() => {
      // Expect setting error to true
      expect(setState).toHaveBeenCalledWith(true);
      done();
    });
  });

  it('fetch data', (done) => {
    jest.spyOn(React, 'useEffect').mockImplementationOnce((f) => f());

    const mockTenantListingData = [
      {
        tenant: 'tenant_1',
        description: '',
        reserved: true,
        tenantValue: 'tenant_1',
      },
    ];

    mockTenantUtils.transformTenantData = jest.fn().mockReturnValue(mockTenantListingData);

    shallow(
      <ManageTab
        coreStart={mockCoreStart as any}
        navigation={{} as any}
        params={{} as any}
        config={config as any}
      />
    );

    process.nextTick(() => {
      expect(mockTenantUtils.fetchTenants).toHaveBeenCalledTimes(1);
      expect(mockTenantUtils.transformTenantData).toHaveBeenCalledTimes(1);
      expect(mockTenantUtils.fetchCurrentTenant).toHaveBeenCalledTimes(1);
      expect(mockAuthInfoUtils.getCurrentUser).toHaveBeenCalledTimes(1);
      expect(setState).toHaveBeenCalledWith(mockTenantListingData);
      done();
    });
  });

  it('delete tenant', (done) => {
    shallow(
      <ManageTab
        coreStart={mockCoreStart as any}
        navigation={{} as any}
        params={{} as any}
        config={config as any}
      />
    );
    const deleteFunc = useDeleteConfirmState.mock.calls[0][0];

    deleteFunc();

    process.nextTick(() => {
      expect(mockTenantUtils.requestDeleteTenant).toBeCalled();
      done();
    });
  });

  it('delete tenant error', (done) => {
    mockTenantUtils.requestDeleteTenant.mockImplementationOnce(() => {
      throw new Error();
    });
    // Hide the error message
    const loggingFunc = jest.fn();
    jest.spyOn(console, 'log').mockImplementationOnce(loggingFunc);
    shallow(
      <ManageTab
        coreStart={mockCoreStart as any}
        navigation={{} as any}
        params={{} as any}
        config={config as any}
      />
    );
    const deleteFunc = useDeleteConfirmState.mock.calls[0][0];

    deleteFunc();

    process.nextTick(() => {
      expect(loggingFunc).toBeCalled();
      done();
    });
  });

  it('submit tenant', () => {
    const component = shallow(
      <ManageTab
        coreStart={mockCoreStart as any}
        navigation={{} as any}
        params={{} as any}
        config={config as any}
      />
    );
    component.find('#createTenant').simulate('click');
    const submitFunc = component.find(TenantEditModal).prop('handleSave');
    submitFunc('tenant_1', '');

    expect(mockTenantUtils.updateTenant).toBeCalled();
  });

  it('submit tenant error', () => {
    const consoleLog = jest.spyOn(console, 'log');
    consoleLog.mockImplementation(() => {});
    const error = new Error();
    mockTenantUtils.updateTenant.mockImplementationOnce(() => {
      throw error;
    });
    const component = shallow(
      <ManageTab
        coreStart={mockCoreStart as any}
        navigation={{} as any}
        params={{} as any}
        config={config as any}
      />
    );
    component.find('#createTenant').simulate('click');
    const submitFunc = component.find(TenantEditModal).prop('handleSave');
    submitFunc('tenant_1', '');

    // Expect error log
    expect(consoleLog).toBeCalledWith(error);
  });

  describe('Action menu enable-disable check', () => {
    const sampleReservedTenant: Tenant = {
      tenant: 'tenant_1',
      description: '',
      reserved: true,
      tenantValue: 'tenant_1',
    };
    const sampleCustomTenant1: Tenant = {
      tenant: 'tenant_2',
      description: '',
      reserved: false,
      tenantValue: 'tenant_2',
    };
    const sampleCustomTenant2: Tenant = {
      tenant: 'tenant_3',
      description: '',
      reserved: false,
      tenantValue: 'tenant_3',
    };

    it('edit and delete should be disabled when selected tenant is reserved', () => {
      jest.spyOn(React, 'useState').mockImplementation(() => [[sampleReservedTenant], jest.fn()]);
      const component = shallow(
        <ManageTab
          coreStart={mockCoreStart as any}
          navigation={{} as any}
          params={{} as any}
          config={config as any}
        />
      );
      expect(component.find('#edit').prop('disabled')).toBe(true);
      expect(component.find('#delete').prop('disabled')).toBe(true);
    });

    it('All menues should be disabled when there is multiple tenant selected including reserved tenant', () => {
      jest
        .spyOn(React, 'useState')
        .mockImplementation(() => [[sampleReservedTenant, sampleCustomTenant1], jest.fn()]);
      const component = shallow(
        <ManageTab
          coreStart={mockCoreStart as any}
          navigation={{} as any}
          params={{} as any}
          config={config as any}
        />
      );
      expect(component.find('#switchTenant').prop('disabled')).toBe(true);
      expect(component.find('#edit').prop('disabled')).toBe(true);
      expect(component.find('#duplicate').prop('disabled')).toBe(true);
      expect(component.find('#createDashboard').prop('disabled')).toBe(true);
      expect(component.find('#createVisualizations').prop('disabled')).toBe(true);
      expect(component.find('#delete').prop('disabled')).toBe(true);
    });

    it('All menues should be disabled except delete when there is multiple custom tenant selected', () => {
      jest
        .spyOn(React, 'useState')
        .mockImplementation(() => [[sampleCustomTenant1, sampleCustomTenant2], jest.fn()]);
      const component = shallow(
        <ManageTab
          coreStart={mockCoreStart as any}
          navigation={{} as any}
          params={{} as any}
          config={config as any}
        />
      );
      expect(component.find('#switchTenant').prop('disabled')).toBe(true);
      expect(component.find('#edit').prop('disabled')).toBe(true);
      expect(component.find('#duplicate').prop('disabled')).toBe(true);
      expect(component.find('#createDashboard').prop('disabled')).toBe(true);
      expect(component.find('#createVisualizations').prop('disabled')).toBe(true);

      expect(component.find('#delete').prop('disabled')).toBe(false);
    });
  });

  describe('Action menu click', () => {
    let component;
    const sampleCustomTenant1: Tenant = {
      tenant: 'tenant_2',
      description: '',
      reserved: false,
      tenantValue: 'tenant_2',
    };

    beforeEach(() => {
      jest.spyOn(React, 'useState').mockImplementation(() => [[sampleCustomTenant1], jest.fn()]);
      component = shallow(
        <ManageTab
          coreStart={mockCoreStart as any}
          navigation={{} as any}
          params={{} as any}
          config={config as any}
        />
      );
    });

    it('switchTenant click', () => {
      component.find('#switchTenant').simulate('click');
      expect(mockTenantUtils.selectTenant).toBeCalled();
    });

    it('Edit click', () => {
      component.find('#edit').simulate('click');
      expect(component).toMatchSnapshot();
    });

    it('Duplicate click', () => {
      component.find('#duplicate').simulate('click');
      expect(component).toMatchSnapshot();
    });

    it('Create dashboard click', () => {
      component.find('#createDashboard').simulate('click');
      expect(mockTenantUtils.selectTenant).toHaveBeenCalled();
    });

    it('Create visualizations click', () => {
      component.find('#createVisualizations').simulate('click');
      expect(mockTenantUtils.selectTenant).toHaveBeenCalled();
    });
  });
});
