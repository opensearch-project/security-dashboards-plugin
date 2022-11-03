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
import { setupTopNavButton } from '../account-app';
import {
  getShouldShowTenantPopup,
  setShouldShowTenantPopup,
  getSavedTenant,
} from '../../../utils/storage-utils';
import { fetchAccountInfoSafe } from '../utils';
import { fetchCurrentAuthType } from '../../../utils/logout-utils';
import { fetchCurrentTenant, selectTenant } from '../../configuration/utils/tenant-utils';

jest.mock('../../../utils/storage-utils', () => ({
  getShouldShowTenantPopup: jest.fn(),
  setShouldShowTenantPopup: jest.fn(),
  getSavedTenant: jest.fn(),
}));

jest.mock('../utils', () => ({
  fetchAccountInfoSafe: jest.fn(),
}));

jest.mock('../../../utils/logout-utils', () => ({
  fetchCurrentAuthType: jest.fn(),
}));

jest.mock('../../configuration/utils/tenant-utils', () => ({
  selectTenant: jest.fn(),
  fetchCurrentTenant: jest.fn(),
}));

describe('Account app', () => {
  const mockCoreStart = {
    chrome: {
      navControls: {
        registerRight: jest.fn(),
      },
    },
  };

  const mockConfig = {
    multitenancy: {
      enable_aggregation_view: true,
    },
  };

  const mockAccountInfo = {
    data: {
      roles: {
        length: 1,
      },
    },
  };

  const mockTenant = 'test1';

  beforeAll(() => {
    (fetchAccountInfoSafe as jest.Mock).mockResolvedValue(mockAccountInfo);
    (fetchCurrentAuthType as jest.Mock).mockResolvedValue('dummy');
    (fetchCurrentTenant as jest.Mock).mockResolvedValue(mockTenant);
  });

  it('Should skip if auto swich if securitytenant in url', (done) => {
    // Trick to mock window.location
    const originalLocation = window.location;
    delete window.location;
    window.location = new URL('http://www.example.com?securitytenant=abc') as any;

    setupTopNavButton(mockCoreStart, mockConfig as any);

    process.nextTick(() => {
      expect(setShouldShowTenantPopup).toBeCalledWith(false);
      window.location = originalLocation;
      done();
    });
  });

  it('Should switch to saved tenant when securitytenant not in url', (done) => {
    (getSavedTenant as jest.Mock).mockReturnValueOnce('tenant1');

    setupTopNavButton(mockCoreStart, mockConfig as any);

    process.nextTick(() => {
      expect(getSavedTenant).toBeCalledTimes(1);
    });

    process.nextTick(() => {
      expect(setShouldShowTenantPopup).toBeCalledWith(false);
      done();
    });
  });

  it('Should show tenant selection popup when neither securitytenant in url nor saved tenant', (done) => {
    (getSavedTenant as jest.Mock).mockReturnValueOnce(null);

    setupTopNavButton(mockCoreStart, mockConfig as any);

    process.nextTick(() => {
      expect(getSavedTenant).toBeCalledTimes(1);
      expect(setShouldShowTenantPopup).toBeCalledWith(true);
      done();
    });
  });
});
