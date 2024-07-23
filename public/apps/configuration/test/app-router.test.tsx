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
import { shallow } from 'enzyme';
import { AppRouter, allNavPanelUrls } from '../app-router';
import { getDataSourceFromUrl } from '../../../utils/datasource-utils';

jest.mock('../../../utils/datasource-utils', () => ({
  getDataSourceFromUrl: jest.fn(),
  LocalCluster: { id: '', label: 'Local cluster' },
}));

describe('SecurityPluginTopNavMenu', () => {
  const coreStartMock = {
    savedObjects: {
      client: jest.fn(),
    },
    notifications: jest.fn(),
    chrome: {
      setBreadcrumbs: jest.fn(),
      navGroup: {
        getNavGroupEnabled: jest.fn().mockReturnValue(false),
      },
    },
  };

  const securityPluginConfigMock = {
    multitenancy: {
      enabled: true,
    },
    ui: {},
  };

  const securityPluginConfigMockMultitenancyDisabled = {
    multitenancy: {
      enabled: false,
    },
    ui: {},
  };

  it('renders DataSourceMenu when dataSource is enabled', () => {
    const wrapper = shallow(
      <AppRouter
        coreStart={coreStartMock}
        depsStart={{}}
        params={{ appBasePath: '' }}
        config={securityPluginConfigMock}
      />
    );

    expect(wrapper).toMatchSnapshot();
  });

  it('getDataSourceFromUrl not called when MDS is disabled', () => {
    const securityPluginStartDepsMock = {
      dataSource: {
        dataSourceEnabled: false,
      },
    };

    shallow(
      <AppRouter
        coreStart={coreStartMock}
        depsStart={securityPluginStartDepsMock}
        params={{ appBasePath: '' }}
        config={securityPluginConfigMock}
      />
    );

    expect(getDataSourceFromUrl).not.toHaveBeenCalled();
  });

  it('getDataSourceFromUrl called when MDS is enabled', () => {
    const securityPluginStartDepsMock = {
      dataSource: {
        dataSourceEnabled: true,
      },
    };

    shallow(
      <AppRouter
        coreStart={coreStartMock}
        depsStart={securityPluginStartDepsMock}
        params={{ appBasePath: '' }}
        config={securityPluginConfigMock}
      />
    );

    expect(getDataSourceFromUrl).toHaveBeenCalled();
  });

  it('checks paths returned with multitenancy off vs on', () => {
    expect(allNavPanelUrls(true)).toContain('/tenants');
    expect(allNavPanelUrls(false)).not.toContain('/tenants');
  });
});
