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
// Import necessary modules and dependencies
import { API_ENDPOINT_MULTITENANCY } from '../../apps/configuration/constants.tsx';
import { addTenantToShareURL, processCopyEvent } from '../shared-link.ts';
import { updateClipboard } from '../shared-link.ts';

describe('addTenantToShareURL function', () => {
  it('should add a listener for copy events', () => {
    const coreMock: any = {
      http: {
        get: jest.fn().mockResolvedValue('mocked-tenant'),
      },
    };

    jest.spyOn(document, 'addEventListener').mockImplementation((event, callback) => {
      if (event === 'copy') {
        callback(new Event('copy'));
        expect(coreMock.http.get).toHaveBeenCalledWith(API_ENDPOINT_MULTITENANCY);
      }
    });

    addTenantToShareURL(coreMock);

    // Add assertions as needed
  });

  // Add more tests for other scenarios if necessary
});

describe('processCopyEvent function', () => {
  it('should update the clipboard and target text content', () => {
    const shareButtonMock: any = {
      getAttribute: jest.fn().mockReturnValue('mocked-share-url'),
    };

    const targetMock: any = {
      textContent: 'mocked-text-content',
    };

    jest.spyOn(document, 'querySelector').mockImplementation((selector) => {
      if (selector === '[data-share-url]') {
        return shareButtonMock;
      } else if (selector === 'body > span') {
        return targetMock;
      }
    });

    processCopyEvent('mocked-tenant');

    // Add assertions based on the behavior of processCopyEvent
    // Add more assertions as needed
  });

  // Add more tests for other scenarios if necessary
});

describe('updateClipboard function', () => {
  it('should update the clipboard and target text content', () => {
    const shareButtonMock: any = {
      getAttribute: jest.fn().mockReturnValue('mocked-share-url'),
      removeAllRanges: jest.fn(),
      addRange: jest.fn(),
    };

    const targetMock: any = {
      textContent: 'mocked-text-content',
    };

    jest.spyOn(document, 'querySelector').mockImplementation((selector) => {
      if (selector === '[data-share-url]') {
        return shareButtonMock;
      } else if (selector === 'body > span') {
        return targetMock;
      }
    });

    jest.spyOn(document, 'createRange').mockReturnValue({
      selectNode: jest.fn(),
    } as any);

    updateClipboard('mocked-url-part', 'mocked-original-value', 'mocked-tenant');

    // Add assertions based on the behavior of updateClipboard
    // Add more assertions as needed
  });

  // Add more tests for other scenarios if necessary
});
