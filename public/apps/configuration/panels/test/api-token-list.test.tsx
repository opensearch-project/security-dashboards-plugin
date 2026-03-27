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
import { EuiInMemoryTable } from '@elastic/eui';
import { ApiTokenList } from '../api-token-list';
import { useDeleteConfirmState } from '../../utils/delete-confirm-modal-utils';

jest.mock('../../utils/api-token-utils', () => ({
  listApiTokens: jest.fn().mockResolvedValue([]),
  requestRevokeApiTokens: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('../../utils/delete-confirm-modal-utils', () => ({
  useDeleteConfirmState: jest.fn().mockReturnValue([jest.fn(), '']),
}));
jest.mock('react', () => ({
  ...jest.requireActual('react'),
  useContext: jest.fn().mockReturnValue({ dataSource: { id: 'test' }, setDataSource: jest.fn() }),
}));

// eslint-disable-next-line
const mockApiTokenUtils = require('../../utils/api-token-utils');

describe('ApiTokenList', () => {
  const mockCoreStart = {
    http: 1,
    uiSettings: {
      get: jest.fn().mockReturnValue(false),
    },
    chrome: {
      navGroup: { getNavGroupEnabled: jest.fn().mockReturnValue(false) },
      setBreadcrumbs: jest.fn(),
    },
  };
  const mockDepsStart = { navigation: { ui: { HeaderControl: {} } } };

  it('renders empty table', () => {
    const component = shallow(
      <ApiTokenList
        coreStart={mockCoreStart as any}
        depsStart={mockDepsStart as any}
        params={{} as any}
        config={{} as any}
      />
    );

    expect(component.find(EuiInMemoryTable).length).toBe(1);
  });

  it('renders table with correct columns including created_by', () => {
    const component = shallow(
      <ApiTokenList
        coreStart={mockCoreStart as any}
        depsStart={mockDepsStart as any}
        params={{} as any}
        config={{} as any}
      />
    );

    const table = component.find(EuiInMemoryTable);
    const columns = table.prop('columns') as any[];
    const columnNames = columns.map((c: any) => c.name);

    expect(columnNames).toContain('Name');
    expect(columnNames).toContain('Status');
    expect(columnNames).toContain('Created by');
    expect(columnNames).toContain('Created');
    expect(columnNames).toContain('Cluster permissions');
    expect(columnNames).toContain('Index permissions');
    expect(columnNames).toContain('Revoked at');
  });

  it('created_by column renders dash when missing', () => {
    const component = shallow(
      <ApiTokenList
        coreStart={mockCoreStart as any}
        depsStart={mockDepsStart as any}
        params={{} as any}
        config={{} as any}
      />
    );

    const table = component.find(EuiInMemoryTable);
    const columns = table.prop('columns') as any[];
    const createdByCol = columns.find((c: any) => c.name === 'Created by');

    expect(createdByCol.render(undefined)).toBe('-');
    expect(createdByCol.render('')).toBe('-');
    expect(createdByCol.render('admin')).toBe('admin');
  });

  it('fetches data on mount', () => {
    jest.spyOn(React, 'useEffect').mockImplementationOnce((f) => f());

    shallow(
      <ApiTokenList
        coreStart={mockCoreStart as any}
        depsStart={mockDepsStart as any}
        params={{} as any}
        config={{} as any}
      />
    );

    expect(mockApiTokenUtils.listApiTokens).toHaveBeenCalled();
  });

  it('revoke calls requestRevokeApiTokens', (done) => {
    shallow(
      <ApiTokenList
        coreStart={mockCoreStart as any}
        depsStart={mockDepsStart as any}
        params={{} as any}
        config={{} as any}
      />
    );

    const revokeFunc = (useDeleteConfirmState as jest.Mock).mock.calls[0][0];
    revokeFunc();

    process.nextTick(() => {
      expect(mockApiTokenUtils.requestRevokeApiTokens).toHaveBeenCalled();
      done();
    });
  });
});
