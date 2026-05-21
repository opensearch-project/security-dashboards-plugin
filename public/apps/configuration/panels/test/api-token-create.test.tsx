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
import { EuiCompressedSuperSelect, EuiCompressedFieldNumber } from '@elastic/eui';
import { ApiTokenCreate, getExpirationSeconds } from '../api-token-create';
import { IndexPermissionPanel } from '../role-edit/index-permission-panel';

jest.mock('../../utils/api-token-utils', () => ({
  createApiToken: jest.fn().mockResolvedValue({ id: '1', token: 'mock-token' }),
}));
jest.mock('../../utils/action-groups-utils', () => ({
  fetchActionGroups: jest.fn().mockResolvedValue({}),
}));
jest.mock('react', () => ({
  ...jest.requireActual('react'),
  useContext: jest.fn().mockReturnValue({ dataSource: { id: 'test' }, setDataSource: jest.fn() }),
}));

describe('ApiTokenCreate', () => {
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

  const renderComponent = () =>
    shallow(
      <ApiTokenCreate
        coreStart={mockCoreStart as any}
        depsStart={mockDepsStart as any}
        params={{} as any}
        config={{} as any}
      />
    );

  it('renders the create form', () => {
    const component = renderComponent();
    expect(component.find(EuiCompressedSuperSelect).length).toBe(1);
  });

  it('renders expiration dropdown with correct options', () => {
    const component = renderComponent();
    const select = component.find(EuiCompressedSuperSelect);
    const options = select.prop('options') as any[];
    const values = options.map((o: any) => o.value);

    expect(values).toContain('30');
    expect(values).toContain('60');
    expect(values).toContain('90');
    expect(values).toContain('custom');
  });

  it('defaults to 90 days expiration', () => {
    const component = renderComponent();
    const select = component.find(EuiCompressedSuperSelect);
    expect(select.prop('valueOfSelected')).toBe('90');
  });

  it('does not show custom days input by default', () => {
    const component = renderComponent();
    expect(component.find(EuiCompressedFieldNumber).length).toBe(0);
  });

  it('passes showAdvancedSecurityOptions={false} to IndexPermissionPanel', () => {
    const component = renderComponent();
    const panel = component.find(IndexPermissionPanel);
    expect(panel.prop('showAdvancedSecurityOptions')).toBe(false);
  });
});

describe('getExpirationSeconds', () => {
  it('returns undefined for "never"', () => {
    expect(getExpirationSeconds('never', '')).toBeUndefined();
  });

  it('returns correct seconds for 30 days', () => {
    expect(getExpirationSeconds('30', '')).toBe(30 * 24 * 60 * 60);
  });

  it('returns correct seconds for 60 days', () => {
    expect(getExpirationSeconds('60', '')).toBe(60 * 24 * 60 * 60);
  });

  it('returns correct seconds for 90 days', () => {
    expect(getExpirationSeconds('90', '')).toBe(90 * 24 * 60 * 60);
  });

  it('returns correct seconds for custom days', () => {
    expect(getExpirationSeconds('custom', '7')).toBe(7 * 24 * 60 * 60);
  });

  it('returns undefined for custom with empty input', () => {
    expect(getExpirationSeconds('custom', '')).toBeUndefined();
  });

  it('returns undefined for custom with zero', () => {
    expect(getExpirationSeconds('custom', '0')).toBeUndefined();
  });

  it('returns undefined for custom with negative', () => {
    expect(getExpirationSeconds('custom', '-5')).toBeUndefined();
  });
});

describe('ApiTokenCreate - additional coverage', () => {
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

  it('renders cancel button linking back to token list', () => {
    const component = shallow(
      <ApiTokenCreate
        coreStart={mockCoreStart as any}
        depsStart={mockDepsStart as any}
        params={{} as any}
        config={{} as any}
      />
    );

    const cancelBtn = component.find('[children="Cancel"]');
    expect(cancelBtn.length).toBe(1);
  });

  it('renders create submit button', () => {
    const component = shallow(
      <ApiTokenCreate
        coreStart={mockCoreStart as any}
        depsStart={mockDepsStart as any}
        params={{} as any}
        config={{} as any}
      />
    );

    const submitBtn = component.find('[data-test-subj="create-api-token-submit"]');
    expect(submitBtn.length).toBe(1);
  });

  it('renders ClusterPermissionPanel', () => {
    const component = shallow(
      <ApiTokenCreate
        coreStart={mockCoreStart as any}
        depsStart={mockDepsStart as any}
        params={{} as any}
        config={{} as any}
      />
    );

    const { ClusterPermissionPanel } = jest.requireActual('../role-edit/cluster-permission-panel');
    expect(component.find('ClusterPermissionPanel').length).toBe(1);
  });
});
