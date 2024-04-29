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
import { AppRouter } from '../app-router';
import { getDataSourceFromUrl } from '../../../utils/datasource-utils';

jest.mock('../../../utils/datasource-utils', () => ({
  getDataSourceFromUrl: jest.fn(),
}));

describe('SecurityPluginTopNavMenu', () => {
  const coreStartMock = {
    savedObjects: {
      client: jest.fn(),
    },
    notifications: jest.fn(),
    chrome: {
      setBreadcrumbs: jest.fn(),
    },
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

    const wrapper = shallow(
      <AppRouter coreStart={coreStartMock} depsStart={{}} params={{ appBasePath: '' }} />
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
      />
    );

    expect(getDataSourceFromUrl).toHaveBeenCalled();
  });
});
