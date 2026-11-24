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
import { act, render, waitFor } from '@testing-library/react';
import { TenantsPanel } from '../tenants-panel';
import { fetchTenants } from '../../../utils/tenant-utils';
import { getCurrentUser } from '../../../../../utils/auth-info-utils';

jest.mock('../../../utils/tenant-utils', () => ({
  ...jest.requireActual('../../../utils/tenant-utils'),
  fetchTenants: jest.fn(),
}));
jest.mock('../../../../../utils/auth-info-utils');

describe('Role view tenants panel with overlapping loads', () => {
  afterEach(() => {
    jest.restoreAllMocks();
    (fetchTenants as jest.Mock).mockReset();
  });

  const baseProps = {
    roleName: 'role',
    errorFlag: false,
    coreStart: { http: {} } as any,
    loading: false,
    isReserved: false,
    tenantPermissions: [{ tenant_patterns: ['team_a'], permissionType: 'Read and Write' } as any],
  };
  const tenants = { team_a: { reserved: false, description: '' } };

  it('keeps the tenants of the latest data source when an older load finishes last', async () => {
    let finishFirstLoad: (value: unknown) => void = () => {};
    (fetchTenants as jest.Mock)
      .mockImplementationOnce(() => new Promise((resolve) => (finishFirstLoad = resolve)))
      .mockImplementationOnce(() => Promise.resolve(tenants));
    (getCurrentUser as jest.Mock).mockResolvedValue('admin');

    const { rerender, container, queryAllByText } = render(
      <TenantsPanel {...baseProps} dataSourceId="old" />
    );
    rerender(<TenantsPanel {...baseProps} dataSourceId="new" />);
    await waitFor(() => expect(queryAllByText('View dashboard')).toHaveLength(1));

    // The old data source has no tenants, so its result would turn the row into N/A.
    await act(async () => {
      finishFirstLoad({});
    });

    expect(fetchTenants).toHaveBeenCalledTimes(2);
    expect((fetchTenants as jest.Mock).mock.calls.map((call) => call[1])).toEqual(['old', 'new']);
    expect(queryAllByText('View dashboard')).toHaveLength(1);
    expect(container.textContent).toContain('Tenant permissions (1)');
  });

  it('shows the loading state until the tenants load', async () => {
    let finishLoad: (value: unknown) => void = () => {};
    (fetchTenants as jest.Mock).mockImplementationOnce(
      () => new Promise((resolve) => (finishLoad = resolve))
    );
    (getCurrentUser as jest.Mock).mockResolvedValue('admin');

    const { container } = render(<TenantsPanel {...baseProps} dataSourceId="ds" />);
    expect(container.querySelector('.euiBasicTable-loading')).not.toBeNull();

    await act(async () => {
      finishLoad(tenants);
    });
    expect(container.querySelector('.euiBasicTable-loading')).toBeNull();
  });

  it('does not show the tenants of the previous data source while the next one loads', async () => {
    (fetchTenants as jest.Mock)
      .mockImplementationOnce(() => Promise.resolve(tenants))
      .mockImplementationOnce(() => new Promise(() => {}));
    (getCurrentUser as jest.Mock).mockResolvedValue('admin');

    const { rerender, container, queryAllByText } = render(
      <TenantsPanel {...baseProps} dataSourceId="first" />
    );
    await waitFor(() => expect(queryAllByText('View dashboard')).toHaveLength(1));

    rerender(<TenantsPanel {...baseProps} dataSourceId="second" />);
    expect(queryAllByText('View dashboard')).toHaveLength(0);
    expect(container.querySelector('.euiBasicTable-loading')).not.toBeNull();
  });

  it('clears a load error when the next data source loads', async () => {
    (fetchTenants as jest.Mock)
      .mockImplementationOnce(() => Promise.reject(new Error('unreachable')))
      .mockImplementationOnce(() => Promise.resolve(tenants));
    (getCurrentUser as jest.Mock).mockResolvedValue('admin');
    jest.spyOn(console, 'log').mockImplementation(() => {});

    const { rerender, container, queryAllByText } = render(
      <TenantsPanel {...baseProps} dataSourceId="broken" />
    );
    await waitFor(() => expect(container.textContent).toContain('Load data failed'));

    rerender(<TenantsPanel {...baseProps} dataSourceId="working" />);
    await waitFor(() => expect(queryAllByText('View dashboard')).toHaveLength(1));
    expect(container.textContent).not.toContain('Load data failed');
  });

  it('shows a role load error that the parent reports after mount', async () => {
    (fetchTenants as jest.Mock).mockResolvedValue(tenants);
    (getCurrentUser as jest.Mock).mockResolvedValue('admin');

    const { rerender, container, queryAllByText } = render(
      <TenantsPanel {...baseProps} dataSourceId="ds" />
    );
    await waitFor(() => expect(queryAllByText('View dashboard')).toHaveLength(1));
    expect(container.textContent).not.toContain('Load data failed');

    rerender(<TenantsPanel {...baseProps} dataSourceId="ds" errorFlag={true} />);
    expect(container.textContent).toContain('Load data failed');
  });
});
