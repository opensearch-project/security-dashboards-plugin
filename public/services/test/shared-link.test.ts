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
import {
  addTenantToShareURL,
  processCopyEvent,
  setClipboardAndTarget,
  updateClipboard,
} from '../shared-link.ts';

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
  });
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

    jest.spyOn(document, 'createRange').mockReturnValue({
      selectNode: jest.fn(),
    } as any);

    processCopyEvent('mocked-tenant');
  });
});

describe('updateClipboard function', () => {
  it('should update the clipboard and target text content', () => {
    const shareButtonMock: any = {
      getAttribute: jest.fn().mockReturnValue('mocked-share-url'),
      removeAllRanges: jest.fn(),
      addRange: jest.fn(),
    };

    document.createRange = jest.fn().mockReturnValue({
      selectNode: jest.fn(),
    });
    document.getSelection = jest.fn().mockReturnValue({
      removeAllRanges: jest.fn(),
      addRange: jest.fn(),
    });

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

    updateClipboard(
      'http://hostname.com/route?param1=value1#hash',
      'http://hostname.com/route?param1=value1#hash',
      'mocked-tenant'
    );

    expect(targetMock.textContent).toBe(
      'http://hostname.com/route?param1=value1&security_tenant=mocked-tenant#hash'
    );

    updateClipboard(
      'http://hostname.com/route?param1=value1#hash',
      '<iframe src="http://hostname.com/route?param1=value1#hash" height="600" width="800"></iframe>',
      'mocked-tenant'
    );

    expect(targetMock.textContent).toBe(
      '<iframe src="http://hostname.com/route?param1=value1&security_tenant=mocked-tenant#hash" height="600" width="800"></iframe>'
    );
  });
});
describe('setClipboardAndTarget function', () => {
  it('should set clipboard and target correctly', () => {
    const shareButtonMock: any = {
      removeAllRanges: jest.fn(),
      addRange: jest.fn(),
    };

    document.createRange = jest.fn().mockReturnValue({
      selectNode: jest.fn(),
    });
    document.getSelection = jest.fn().mockReturnValue({
      removeAllRanges: jest.fn(),
      addRange: jest.fn(),
    });

    const targetMock: any = {
      textContent: 'mocked-text-content',
    };
    setClipboardAndTarget(targetMock, 'mocked-new-value', 'mocked-original-value');

    expect(targetMock.textContent).toBe('mocked-new-value');
  });
});
