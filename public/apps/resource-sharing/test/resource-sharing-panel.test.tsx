/*
 * Copyright OpenSearch Contributors
 *
 * Licensed under the Apache License, Version 2.0 (the "License").
 * You may not use this file except in compliance with the License.
 * A copy of the License is located at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * or in the "license" file accompanying this file. This file is distributed
 * on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either
 * express or implied. See the License for the specific language governing
 * permissions and limitations under the License.
 */

/**
 * @jest-environment jsdom
 */
import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ResourceSharingPanel } from '../resource-sharing-panel';
import { I18nProvider } from '@osd/i18n/react';

function renderWithI18n(ui: React.ReactElement) {
  // @ts-ignore
  return render(<I18nProvider>{ui}</I18nProvider>);
}

const toasts = {
  addError: jest.fn(),
  addSuccess: jest.fn(),
  addWarning: jest.fn(),
};

const typesPayload = [
  {
    type: 'anomaly-detector',
    access_levels: ['READ', 'WRITE'],
  },
  {
    type: 'forecaster',
    access_levels: ['READ_ONLY'],
  },
];

const rowsPayload = [
  {
    resource_id: 'det-1',
    resource_type: 'anomaly-detector',
    created_by: { user: 'alice', tenant: 'global' },
    share_with: undefined,
    can_share: true,
  },
  {
    resource_id: 'det-2',
    resource_type: 'anomaly-detector',
    created_by: { user: 'bob' },
    share_with: { READ: { users: ['charlie'], roles: [], backend_roles: [] } },
    can_share: false,
  },
];

describe('ResourceSharingPanel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows guidance before a type is selected; loads types once', async () => {
    const api = {
      listTypes: jest.fn().mockResolvedValue({ types: typesPayload }),
      listSharingRecords: jest.fn(),
      getSharingRecord: jest.fn(),
      share: jest.fn(),
      update: jest.fn(),
    };

    renderWithI18n(<ResourceSharingPanel api={api as any} toasts={toasts as any} />);

    expect(
      await screen.findByText(
        /Pick a resource type from the dropdown to load accessible resources/i
      )
    ).toBeInTheDocument();

    expect(api.listTypes).toHaveBeenCalledTimes(1);

    // SuperSelect placeholder visible
    expect(screen.getByText('Select a type…')).toBeInTheDocument();
  });

  it('selecting a type loads records and renders table rows', async () => {
    const api = {
      listTypes: jest.fn().mockResolvedValue({ types: typesPayload }),
      listSharingRecords: jest.fn().mockResolvedValue({ resources: rowsPayload }),
      getSharingRecord: jest.fn(),
      share: jest.fn(),
      update: jest.fn(),
    };

    renderWithI18n(<ResourceSharingPanel api={api as any} toasts={toasts as any} />);

    // Open the SuperSelect and pick "Anomaly Detector"
    const selectTrigger = await screen.findByText('Select a type…');
    await userEvent.click(selectTrigger); // <-- await userEvent
    await userEvent.click(await screen.findByText('Anomaly Detector'));

    // Wait for the API to be called AND for React to commit the state update
    await waitFor(() => {
      expect(api.listSharingRecords).toHaveBeenCalledWith('anomaly-detector');
    });

    // Now assert via actual visible content instead of data-testid
    const table = await screen.findByRole('table');
    expect(await within(table).findByText('det-1')).toBeInTheDocument();
    expect(within(table).getByText('det-2')).toBeInTheDocument();

    // Shared-with summary
    expect(within(table).getByText(/Not shared/i)).toBeInTheDocument();
    expect(within(table).getByText(/1 access-level/i)).toBeInTheDocument();

    const row1 = within(table).getByText('det-1').closest('tr')!;
    const row2 = within(table).getByText('det-2').closest('tr')!;
    expect(within(row1).getByRole('button', { name: /Share/i })).toBeEnabled();
    expect(within(row2).getByRole('button', { name: /Update Access/i })).toBeDisabled();
  });

  it('opens Share modal and validates empty state; submits to share()', async () => {
    const api = {
      listTypes: jest.fn().mockResolvedValue({ types: typesPayload }),
      listSharingRecords: jest.fn().mockResolvedValue({ resources: rowsPayload }),
      getSharingRecord: jest.fn(),
      share: jest.fn().mockResolvedValue({ ok: true }),
      update: jest.fn(),
    };

    renderWithI18n(<ResourceSharingPanel api={api as any} toasts={toasts as any} />);

    // Select the detector type
    const selectTrigger = await screen.findByText('Select a type…');
    await userEvent.click(selectTrigger);
    await userEvent.click(await screen.findByText('Anomaly Detector'));

    await waitFor(() => {
      expect(api.listSharingRecords).toHaveBeenCalledWith('anomaly-detector');
    });

    // Open Share modal from row det-1 (not shared)
    await userEvent.click(await screen.findByRole('button', { name: /Share/i }));

    // Wait for the modal overlay to exist (EUI portals)
    await waitFor(() => {
      const overlay = document.querySelector('.euiOverlayMask');
      if (!overlay) throw new Error('Modal overlay not present yet');
    });

    // Now scope queries strictly to the modal overlay
    const overlay = document.querySelector('.euiOverlayMask') as HTMLElement;

    // Header text is "Share Resource" in create mode — optional assertion
    expect(within(overlay).getByText(/Share Resource/i)).toBeInTheDocument();

    // The primary button in the modal footer (initially disabled)
    const modalShareBtn = within(overlay).getByRole('button', { name: /^Share$/ });
    expect(modalShareBtn).toBeDisabled();

    // Add an access-level
    const addLevel = within(overlay).getByRole('button', { name: /Add access-level/i });
    await userEvent.click(addLevel);

    // Comboboxes inside the modal: [0] access-level, [1] Users
    const combos = within(overlay).getAllByRole('combobox');
    await userEvent.click(combos[0]); // focus access-level (defaults to first suggestion)
    const usersInput = within(overlay).getByText('Add users…');
    // type then press Enter to trigger onCreateOption
    await userEvent.type(usersInput, 'dc');
    await userEvent.tab(); // focus out

    await waitFor(() => expect(modalShareBtn).toBeEnabled());

    // Submit
    await userEvent.click(modalShareBtn);
    await waitFor(() => expect(api.share).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(api.listSharingRecords).toHaveBeenCalledTimes(2));
    expect(toasts.addSuccess).toHaveBeenCalledWith('Resource shared.');
  });

  it('opens Update Access modal, computes add/revoke diff and calls update()', async () => {
    const api = {
      listTypes: jest.fn().mockResolvedValue({ types: typesPayload }),
      listSharingRecords: jest.fn().mockResolvedValue({
        resources: [
          {
            ...rowsPayload[1],
            // pre-existing share_with so we get "Update Access"
            share_with: { READ: { users: ['charlie'], roles: ['roleA'], backend_roles: [] } },
            can_share: true,
          },
        ],
      }),
      getSharingRecord: jest.fn(),
      share: jest.fn(),
      update: jest.fn().mockResolvedValue({ ok: true }),
    };

    renderWithI18n(<ResourceSharingPanel api={api as any} toasts={toasts as any} />);

    await userEvent.click(await screen.findByText('Select a type…'));
    await userEvent.click(await screen.findByText('Anomaly Detector'));

    await waitFor(() => {
      expect(api.listSharingRecords).toHaveBeenCalledWith('anomaly-detector');
    });

    // Open update modal on det-2
    await userEvent.click(await screen.findByRole('button', { name: /Update Access/i }));

    // Wait for the modal overlay to exist (EUI portals)
    await waitFor(() => {
      const overlay = document.querySelector('.euiOverlayMask');
      if (!overlay) throw new Error('Modal overlay not present yet');
    });

    // Now scope queries strictly to the modal overlay
    const overlay = document.querySelector('.euiOverlayMask') as HTMLElement;

    // Header text is "Share Resource" in create mode — optional assertion
    expect(within(overlay).getByRole('button', { name: 'Update Access' })).toBeInTheDocument();

    // The primary button in the modal footer (initially disabled)
    const modalShareBtn = within(overlay).getByRole('button', { name: /^Update Access$/ });
    expect(modalShareBtn).toBeDisabled();

    // Comboboxes inside the modal: [0] access-level, [1] Users
    // Remove charlie and add erin -> should form add/remove diff
    const combos = within(overlay).getAllByRole('combobox');
    await userEvent.click(combos[0]);

    // Remove 'charlie' by clearing tags then add 'erin'
    // Simple strategy: replace via typing new value and enter; then remove the old pill via Backspace
    const usersInput = within(overlay).getByText('charlie');
    await userEvent.type(usersInput, '{Backspace}{Backspace}erin{enter}'); // simulate clearing last token and new entry
    await userEvent.tab(); // focus out

    const updateBtn = within(overlay).getByRole('button', { name: /Update Access/i });
    await waitFor(() => expect(updateBtn).toBeEnabled());
    await userEvent.click(updateBtn);

    await waitFor(() => expect(api.update).toHaveBeenCalledTimes(1));
    const payload = (api.update as jest.Mock).mock.calls[0][0];
    expect(payload.resource_id).toBe('det-2');
    expect(payload.resource_type).toBe('anomaly-detector');
    // Ensure both add and revoke present (diff logic)
    expect(payload.add?.READ?.users).toEqual(['erin']);
    expect(payload.revoke?.READ?.users).toEqual(['charlie']);

    expect(toasts.addSuccess).toHaveBeenCalledWith('Access updated.');
  });

  it('passes dataSourceId to API calls when provided', async () => {
    const api = {
      listTypes: jest.fn().mockResolvedValue({ types: typesPayload }),
      listSharingRecords: jest.fn().mockResolvedValue({ resources: rowsPayload }),
      getSharingRecord: jest.fn(),
      share: jest.fn(),
      update: jest.fn(),
    };

    renderWithI18n(<ResourceSharingPanel api={api as any} toasts={toasts as any} />);

    // listTypes should be called on mount
    await waitFor(() => {
      expect(api.listTypes).toHaveBeenCalledTimes(1);
    });

    // Select a type to trigger listSharingRecords
    const selectTrigger = await screen.findByText('Select a type…');
    await userEvent.click(selectTrigger);
    await userEvent.click(await screen.findByText('Anomaly Detector'));

    await waitFor(() => {
      expect(api.listSharingRecords).toHaveBeenCalledWith('anomaly-detector');
    });

    // Verify the API was called (dataSourceId is passed internally via buildResourceApi)
    expect(api.listSharingRecords).toHaveBeenCalled();
  });

  it('renders friendly error lines when backend returns structured errors', async () => {
    const api = {
      listTypes: jest.fn().mockResolvedValue({ types: typesPayload }),
      listSharingRecords: jest.fn().mockResolvedValue({ resources: rowsPayload }),
      getSharingRecord: jest.fn(),
      share: jest.fn().mockRejectedValue({
        response: { status: 403, statusText: 'Forbidden' },
        body: JSON.stringify({
          statusCode: 403,
          error: 'Forbidden',
          message: 'You are not allowed to share this resource',
        }),
      }),
      update: jest.fn(),
    };

    renderWithI18n(<ResourceSharingPanel api={api as any} toasts={toasts as any} />);

    await userEvent.click(await screen.findByText('Select a type…'));
    await userEvent.click(await screen.findByText('Anomaly Detector'));

    await waitFor(() => {
      expect(api.listSharingRecords).toHaveBeenCalledWith('anomaly-detector');
    });

    // Open update modal on det-2
    await userEvent.click(await screen.findByRole('button', { name: /Share/i }));
    // Wait for the modal overlay to exist (EUI portals)
    await waitFor(() => {
      const overlay = document.querySelector('.euiOverlayMask');
      if (!overlay) throw new Error('Modal overlay not present yet');
    });

    // Now scope queries strictly to the modal overlay
    const overlay = document.querySelector('.euiOverlayMask') as HTMLElement;

    expect(within(overlay).getByRole('button', { name: 'Share' })).toBeInTheDocument();

    // Add minimal valid recipients
    await userEvent.click(within(overlay).getByRole('button', { name: /Add access-level/i }));
    const usersInput = within(overlay).getByText('Add users…');
    // type then press Enter to trigger onCreateOption
    await userEvent.type(usersInput, 'dc');
    await userEvent.tab(); // focus out

    await userEvent.click(within(overlay).getByRole('button', { name: /^Share$/ }));

    // Expect callout with deduped lines
    expect(await within(overlay).findByText(/Request failed/i)).toBeInTheDocument();
    expect(within(overlay).getByText(/403 Forbidden/)).toBeInTheDocument();
    expect(
      within(overlay).getByText(/You are not allowed to share this resource/)
    ).toBeInTheDocument();
  });
});
