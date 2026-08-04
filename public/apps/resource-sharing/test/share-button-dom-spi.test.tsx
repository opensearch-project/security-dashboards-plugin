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
import { waitFor } from '@testing-library/react';

import { startShareButtonDomSpi } from '../share-button-dom-spi';
import { resetShareButtonRequestCache } from '../resource-share-button';
import { buildResourceApi } from '../../../utils/resource-sharing-utils';

jest.mock('../../../utils/resource-sharing-utils', () => ({
  buildResourceApi: jest.fn(),
}));

const mockBuildResourceApi = buildResourceApi as jest.Mock;

const core = {
  http: {},
  notifications: {
    toasts: { addSuccess: jest.fn(), addError: jest.fn(), addWarning: jest.fn() },
  },
} as any;

const typesPayload = {
  types: [{ type: 'anomaly-detector', access_levels: ['READ', 'WRITE'] }],
};

const record = {
  resource_id: 'det-1',
  resource_type: 'anomaly-detector',
  created_by: { user: 'alice' },
  share_with: undefined,
  can_share: true,
};

function makeApi() {
  const api = {
    listTypes: jest.fn().mockResolvedValue(typesPayload),
    listSharingRecords: jest.fn().mockResolvedValue({ resources: [record] }),
    getSharingRecord: jest.fn(),
    share: jest.fn(),
    update: jest.fn(),
  };
  mockBuildResourceApi.mockReturnValue(api);
  return api;
}

const flushObserver = () => new Promise((resolve) => setTimeout(resolve, 0));

describe('startShareButtonDomSpi', () => {
  let teardown: (() => void) | undefined;

  beforeEach(() => {
    jest.clearAllMocks();
    resetShareButtonRequestCache();
    document.body.innerHTML = '';
    makeApi();
  });

  afterEach(() => {
    teardown?.();
    teardown = undefined;
    document.body.innerHTML = '';
  });

  const addMarker = (id = 'det-1', type = 'anomaly-detector') => {
    const el = document.createElement('div');
    el.setAttribute('data-resource-share-button', '');
    el.setAttribute('data-resource-id', id);
    el.setAttribute('data-resource-type', type);
    document.body.appendChild(el);
    return el;
  };

  it('mounts the share button into a pre-existing marker', async () => {
    const el = addMarker();
    teardown = startShareButtonDomSpi(core);

    await waitFor(() =>
      expect(el.querySelector('[data-test-subj="resource-share-button-det-1"]')).toBeTruthy()
    );
    expect(el.textContent).toContain('Share');
  });

  it('mounts into markers added after startup (MutationObserver)', async () => {
    teardown = startShareButtonDomSpi(core);
    const el = addMarker();
    await flushObserver();

    await waitFor(() =>
      expect(el.querySelector('[data-test-subj="resource-share-button-det-1"]')).toBeTruthy()
    );
  });

  it('ignores markers missing required attributes', async () => {
    teardown = startShareButtonDomSpi(core);
    const el = document.createElement('div');
    el.setAttribute('data-resource-share-button', '');
    // no resource id / type
    document.body.appendChild(el);
    await flushObserver();

    expect(el.childNodes.length).toBe(0);
    expect(mockBuildResourceApi).not.toHaveBeenCalled();
  });

  it('unmounts when the marker is removed from the document', async () => {
    teardown = startShareButtonDomSpi(core);
    const el = addMarker();
    await waitFor(() =>
      expect(el.querySelector('[data-test-subj="resource-share-button-det-1"]')).toBeTruthy()
    );

    document.body.removeChild(el);
    await flushObserver();

    expect(el.childNodes.length).toBe(0);
  });

  it('remounts when marker attributes change', async () => {
    const api = makeApi();
    api.listSharingRecords.mockResolvedValue({
      resources: [record, { ...record, resource_id: 'det-2' }],
    });
    teardown = startShareButtonDomSpi(core);
    const el = addMarker('det-1');
    await waitFor(() =>
      expect(el.querySelector('[data-test-subj="resource-share-button-det-1"]')).toBeTruthy()
    );

    el.setAttribute('data-resource-id', 'det-2');
    await flushObserver();

    await waitFor(() =>
      expect(el.querySelector('[data-test-subj="resource-share-button-det-2"]')).toBeTruthy()
    );
  });

  it('teardown unmounts all buttons and stops observing', async () => {
    teardown = startShareButtonDomSpi(core);
    const el = addMarker();
    await waitFor(() =>
      expect(el.querySelector('[data-test-subj="resource-share-button-det-1"]')).toBeTruthy()
    );

    teardown();
    teardown = undefined;
    expect(el.childNodes.length).toBe(0);

    const el2 = addMarker('det-9');
    await flushObserver();
    expect(el2.childNodes.length).toBe(0);
  });
});
