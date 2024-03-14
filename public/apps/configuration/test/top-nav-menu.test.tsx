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
import { mount, render, shallow } from 'enzyme';
import { SecurityPluginTopNavMenu } from '../top-nav-menu';
import {
  DataSourceManagementPluginSetup,
  DataSourceMenu,
} from '../../../../../../src/plugins/data_source_management/public';

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
      DataSourceMenu: dataSourceMenuMock,
    },
  };

  it('renders DataSourceMenu when dataSource is enabled', () => {
    const securityPluginStartDepsMock = {
      dataSource: {
        dataSourceEnabled: true,
      },
    };

    const wrapper = render(
      <SecurityPluginTopNavMenu
        coreStart={coreStartMock}
        securityPluginStartDeps={securityPluginStartDepsMock}
        dataSourcePickerReadOnly={false}
        dataSourceManagement={dataSourceManagementMock}
        setHeaderActionMenu={() => {}}
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
        securityPluginStartDeps={securityPluginStartDepsMock}
        dataSourcePickerReadOnly={false}
        dataSourceManagement={dataSourceManagementMock}
        setHeaderActionMenu={() => {}}
      />
    );

    expect(dataSourceMenuMock).not.toBeCalled();
    expect(wrapper.html()).toBe('');
  });
});