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
import { configure, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

configure({ testIdAttribute: 'data-test-subj' });

import { ResourceShareButton, resetShareButtonRequestCache } from '../resource-share-button';
import { buildResourceApi } from '../../../utils/resource-sharing-utils';

jest.mock('../../../utils/resource-sharing-utils', () => ({
  buildResourceApi: jest.fn(),
}));

const mockBuildResourceApi = buildResourceApi as jest.Mock;

const http = {} as any;
const notifications = {
  toasts: {
    addSuccess: jest.fn(),
    addError: jest.fn(),
    addWarning: jest.fn(),
  },
} as any;

const typesPayload = {
  types: [
    { type: 'anomaly-detector', access_levels: ['READ', 'WRITE'] },
    { type: 'forecaster', access_levels: ['READ_ONLY'] },
  ],
};

const unsharedRecord = {
  resource_id: 'det-1',
  resource_type: 'anomaly-detector',
  created_by: { user: 'alice' },
  share_with: undefined,
  can_share: true,
};

const sharedRecord = {
  resource_id: 'det-2',
  resource_type: 'anomaly-detector',
  created_by: { user: 'bob' },
  share_with: { READ: { users: ['charlie'] } },
  can_share: true,
};

const notShareableRecord = {
  ...sharedRecord,
  resource_id: 'det-3',
  can_share: false,
};

function makeApi(overrides: Partial<Record<string, jest.Mock>> = {}) {
  const api = {
    listTypes: jest.fn().mockResolvedValue(typesPayload),
    listSharingRecords: jest
      .fn()
      .mockResolvedValue({ resources: [unsharedRecord, sharedRecord, notShareableRecord] }),
    getSharingRecord: jest.fn(),
    share: jest.fn().mockResolvedValue({}),
    update: jest.fn().mockResolvedValue({}),
    ...overrides,
  };
  mockBuildResourceApi.mockReturnValue(api);
  return api;
}

describe('ResourceShareButton', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetShareButtonRequestCache();
  });

  it('renders enabled "Share" button for an unshared resource the user can share', async () => {
    makeApi();
    render(
      <ResourceShareButton
        resourceId="det-1"
        resourceType="anomaly-detector"
        http={http}
        notifications={notifications}
      />
    );

    const button = await screen.findByTestId('resource-share-button-det-1');
    await waitFor(() => expect(button).not.toBeDisabled());
    expect(button).toHaveTextContent('Share');
    // Private status badge shown beside the action for an unshared resource
    expect(await screen.findByTestId('resource-share-status-det-1')).toHaveTextContent('Private');
  });

  it('renders "Manage access" for an already shared resource', async () => {
    makeApi();
    render(
      <ResourceShareButton
        resourceId="det-2"
        resourceType="anomaly-detector"
        http={http}
        notifications={notifications}
      />
    );

    const button = await screen.findByTestId('resource-share-button-det-2');
    await waitFor(() => expect(button).not.toBeDisabled());
    expect(button).toHaveTextContent('Manage access');
    // Shared status pill shown beside the action
    expect(await screen.findByTestId('resource-share-status-det-2')).toHaveTextContent('Shared');
  });

  it('shows the resource name and humanized access levels in the modal', async () => {
    makeApi();
    render(
      <ResourceShareButton
        resourceId="det-2"
        resourceType="anomaly-detector"
        resourceName="my-cpu-detector"
        http={http}
        notifications={notifications}
      />
    );

    const button = await screen.findByTestId('resource-share-button-det-2');
    await waitFor(() => expect(button).not.toBeDisabled());
    await userEvent.click(button);

    // Edit-mode title (also on the trigger button, hence >1) and display name
    await waitFor(() => expect(screen.getAllByText('Manage access').length).toBeGreaterThan(1));
    expect(screen.getByText(/my-cpu-detector/)).toBeInTheDocument();
    // Raw level token `READ` renders humanized in the level combo
    expect(screen.getAllByText('Read only').length).toBeGreaterThan(0);
    // Primary action reads Save changes
    expect(screen.getByTestId('share-access-modal-submit')).toHaveTextContent('Save changes');
  });

  it('disables the button when the user cannot share the resource', async () => {
    makeApi();
    render(
      <ResourceShareButton
        resourceId="det-3"
        resourceType="anomaly-detector"
        http={http}
        notifications={notifications}
      />
    );

    const button = await screen.findByTestId('resource-share-button-det-3');
    await waitFor(() => expect(button).toBeDisabled());
  });

  it('disables the button when the resource is not in the accessible list', async () => {
    makeApi();
    render(
      <ResourceShareButton
        resourceId="unknown-id"
        resourceType="anomaly-detector"
        http={http}
        notifications={notifications}
      />
    );

    const button = await screen.findByTestId('resource-share-button-unknown-id');
    await waitFor(() => expect(button).toBeDisabled());
  });

  it('renders nothing when the resource type is not registered', async () => {
    makeApi();
    const { container } = render(
      <ResourceShareButton
        resourceId="det-1"
        resourceType="not-a-registered-type"
        http={http}
        notifications={notifications}
      />
    );

    await waitFor(() => expect(mockBuildResourceApi).toHaveBeenCalled());
    await waitFor(() => expect(container).toBeEmptyDOMElement());
  });

  it('renders nothing when resource sharing is disabled on the cluster (501)', async () => {
    makeApi({
      listTypes: jest.fn().mockRejectedValue({ response: { status: 501 }, message: 'disabled' }),
      listSharingRecords: jest
        .fn()
        .mockRejectedValue({ response: { status: 501 }, message: 'disabled' }),
    });
    const { container } = render(
      <ResourceShareButton
        resourceId="det-1"
        resourceType="anomaly-detector"
        http={http}
        notifications={notifications}
      />
    );

    await waitFor(() => expect(container).toBeEmptyDOMElement());
  });

  it('shows a disabled button (not hidden) on transient fetch errors', async () => {
    makeApi({
      listTypes: jest.fn().mockRejectedValue({ response: { status: 500 }, message: 'boom' }),
    });
    render(
      <ResourceShareButton
        resourceId="det-1"
        resourceType="anomaly-detector"
        http={http}
        notifications={notifications}
      />
    );

    const button = await screen.findByTestId('resource-share-button-det-1');
    await waitFor(() => expect(button).toBeDisabled());
  });

  it('opens the share modal and submits a new share', async () => {
    const api = makeApi();
    const onUpdated = jest.fn();
    render(
      <ResourceShareButton
        resourceId="det-1"
        resourceType="anomaly-detector"
        onUpdated={onUpdated}
        http={http}
        notifications={notifications}
      />
    );

    const button = await screen.findByTestId('resource-share-button-det-1');
    await waitFor(() => expect(button).not.toBeDisabled());
    await userEvent.click(button);

    // Modal opens in create mode
    expect(await screen.findByText('Share resource')).toBeInTheDocument();

    // Add a person in the READ section's Users field (create seeds the first level)
    const peopleInput = within(screen.getByTestId('share-access-users-READ')).getByRole('textbox');
    await userEvent.type(peopleInput, 'dave{enter}');

    // Submit
    const submit = await screen.findByTestId('share-access-modal-submit');
    await waitFor(() => expect(submit).not.toBeDisabled());
    await userEvent.click(submit);

    await waitFor(() =>
      expect(api.share).toHaveBeenCalledWith({
        resource_id: 'det-1',
        resource_type: 'anomaly-detector',
        share_with: { READ: { users: ['dave'] } },
      })
    );
    expect(notifications.toasts.addSuccess).toHaveBeenCalledWith('Resource shared.');
    await waitFor(() => expect(onUpdated).toHaveBeenCalled());
  });

  it('controlled mode: hides trigger and shows modal when isModalOpen is true', async () => {
    makeApi();
    const onModalClose = jest.fn();
    render(
      <ResourceShareButton
        resourceId="det-1"
        resourceType="anomaly-detector"
        isModalOpen={true}
        onModalClose={onModalClose}
        http={http}
        notifications={notifications}
      />
    );

    // No trigger button in controlled mode
    expect(screen.queryByTestId('resource-share-button-det-1')).not.toBeInTheDocument();
    // Modal opens once the record is loaded
    expect(await screen.findByText('Share resource')).toBeInTheDocument();
  });

  it('controlled mode: warns and closes when user cannot share', async () => {
    makeApi();
    const onModalClose = jest.fn();
    render(
      <ResourceShareButton
        resourceId="det-3"
        resourceType="anomaly-detector"
        isModalOpen={true}
        onModalClose={onModalClose}
        http={http}
        notifications={notifications}
      />
    );

    await waitFor(() => expect(notifications.toasts.addWarning).toHaveBeenCalled());
    expect(onModalClose).toHaveBeenCalled();
    expect(screen.queryByText('Share resource')).not.toBeInTheDocument();
    expect(screen.queryByText('Manage access')).not.toBeInTheDocument();
  });

  it('controlled mode: renders nothing visible when isModalOpen is false', async () => {
    makeApi();
    const { container } = render(
      <ResourceShareButton
        resourceId="det-1"
        resourceType="anomaly-detector"
        isModalOpen={false}
        onModalClose={jest.fn()}
        http={http}
        notifications={notifications}
      />
    );

    await waitFor(() => expect(mockBuildResourceApi).toHaveBeenCalled());
    expect(container).toBeEmptyDOMElement();
  });

  it('hides the status pill when showStatus is false (detail pages)', async () => {
    makeApi();
    render(
      <ResourceShareButton
        resourceId="det-2"
        resourceType="anomaly-detector"
        showStatus={false}
        http={http}
        notifications={notifications}
      />
    );

    const button = await screen.findByTestId('resource-share-button-det-2');
    await waitFor(() => expect(button).not.toBeDisabled());
    expect(screen.queryByTestId('resource-share-status-det-2')).not.toBeInTheDocument();
  });

  it('renders a compact icon-only trigger with display="icon"', async () => {
    makeApi();
    render(
      <ResourceShareButton
        resourceId="det-1"
        resourceType="anomaly-detector"
        display="icon"
        http={http}
        notifications={notifications}
      />
    );

    const button = await screen.findByTestId('resource-share-button-det-1');
    await waitFor(() => expect(button).not.toBeDisabled());
    // Icon-only: label is exposed as aria-label, not text content
    expect(button).toHaveAttribute('aria-label', 'Share');
    expect(button).not.toHaveTextContent('Share');

    // Still opens the shared modal
    await userEvent.click(button);
    expect(await screen.findByText('Share resource')).toBeInTheDocument();
  });

  it('coalesces types/list requests across concurrently rendered buttons', async () => {
    const api = makeApi();
    render(
      <>
        <ResourceShareButton
          resourceId="det-1"
          resourceType="anomaly-detector"
          http={http}
          notifications={notifications}
        />
        <ResourceShareButton
          resourceId="det-2"
          resourceType="anomaly-detector"
          http={http}
          notifications={notifications}
        />
        <ResourceShareButton
          resourceId="det-3"
          resourceType="anomaly-detector"
          http={http}
          notifications={notifications}
        />
      </>
    );

    await screen.findByTestId('resource-share-button-det-1');
    await screen.findByTestId('resource-share-button-det-2');
    await screen.findByTestId('resource-share-button-det-3');

    // Three buttons, one shared fetch each for types and list
    expect(api.listTypes).toHaveBeenCalledTimes(1);
    expect(api.listSharingRecords).toHaveBeenCalledTimes(1);
  });
});
