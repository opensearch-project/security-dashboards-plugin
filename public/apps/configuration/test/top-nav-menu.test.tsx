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

import React from 'react';
import { render } from 'enzyme';
import { SecurityPluginTopNavMenu } from '../top-nav-menu';

describe('SecurityPluginTopNavMenu', () => {
  const coreStartMock = {
    savedObjects: {
      client: jest.fn(),
    },
    notifications: jest.fn(),
  };

  const dataSourceMenuMock = jest.fn(() => <div>Mock DataSourceMenu</div>);

  const dataSourceManagementMock = {
    ui: {
      getDataSourceMenu: jest.fn().mockReturnValue(dataSourceMenuMock),
    },
  };

  it('renders DataSourceMenu when dataSource is enabled', () => {
    const securityPluginStartDepsMock = {
      dataSource: {
        dataSourceEnabled: true,
      },
    };
    const securityPluginConfigMock = {
      multitenancy: {
        enabled: false,
      },
    };

    const wrapper = render(
      <SecurityPluginTopNavMenu
        coreStart={coreStartMock}
        depsStart={securityPluginStartDepsMock}
        config={securityPluginConfigMock}
        dataSourcePickerReadOnly={false}
        dataSourceManagement={dataSourceManagementMock}
        selectedDataSource={{}}
        params={{}}
      />
    );

    expect(dataSourceMenuMock).toBeCalled();
    expect(wrapper.html()).not.toBe('');
  });

  it('renders null when dataSource is disabled', () => {
    const securityPluginStartDepsMock = {
      dataSource: {
        dataSourceEnabled: false,
      },
    };

    const wrapper = render(
      <SecurityPluginTopNavMenu
        coreStart={coreStartMock}
        depsStart={securityPluginStartDepsMock}
        dataSourcePickerReadOnly={false}
        dataSourceManagement={dataSourceManagementMock}
        setHeaderActionMenu={() => {}}
        params={{}}
      />
    );

    expect(dataSourceMenuMock).not.toBeCalled();
    expect(wrapper.html()).toBe('');
  });

  it('renders null when dataSource is enabled but selectedDataSource is undefined', () => {
    const securityPluginStartDepsMock = {
      dataSource: {
        dataSourceEnabled: true,
      },
    };

    const wrapper = render(
      <SecurityPluginTopNavMenu
        coreStart={coreStartMock}
        depsStart={securityPluginStartDepsMock}
        dataSourcePickerReadOnly={false}
        dataSourceManagement={dataSourceManagementMock}
        selectedDataSource={() => undefined}
        params={{}}
      />
    );

    expect(dataSourceMenuMock).toBeCalled();
    expect(wrapper.html()).not.toBe('');
  });
});
