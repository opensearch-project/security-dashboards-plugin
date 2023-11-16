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
import { setClipboardAndTarget } from '../shared-link.ts';

describe('setClipboardAndTarget function', () => {
  // Declare variables for the mock elements
  let shareButtonMock: any;
  let targetMock: any;
  let mockSpan: HTMLSpanElement;

  // Before each test, set up the mock elements
  beforeEach(() => {
    shareButtonMock = {
      removeAllRanges: jest.fn(),
      addRange: jest.fn(),
    };

    targetMock = {
      textContent: 'mocked-original-value',
    };

    // Create a mock span element and append it to the document
    mockSpan = document.createElement('span');
    document.body.appendChild(mockSpan);
  });

  // After each test, clean up the appended mock span element
  afterEach(() => {
    document.body.removeChild(mockSpan);
  });

  it('should set clipboard and target correctly', () => {
    const newValue = 'mocked-new-value';

    // Mock document.createRange to spy on its usage
    const createRangeMock = jest.spyOn(document, 'createRange').mockReturnValue({
      selectNode: jest.fn(),
    } as any);

    // Call the function
    setClipboardAndTarget(shareButtonMock, targetMock, newValue, 'mocked-original-value');

    // Assertions
    expect(shareButtonMock.removeAllRanges).toHaveBeenCalled();
    expect(createRangeMock).toHaveBeenCalled();
    expect(shareButtonMock.addRange).toHaveBeenCalled();
    expect(targetMock.textContent).toBe(newValue);

    // Reset the mock to restore the original function
    createRangeMock.mockRestore();
  });
});

