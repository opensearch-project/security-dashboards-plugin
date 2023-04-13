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
import { deflateValue, inflateValue } from './compression';

describe('test compression', () => {
  test('get original value from deflated value', () => {
    const originalValue = 'This is the original value';
    const deflatedValue: Buffer = deflateValue(originalValue);
    const inflatedValue: Buffer = inflateValue(deflatedValue);

    // Make sure deflateValue actually does something
    expect(deflatedValue).not.toEqual(originalValue);

    expect(inflatedValue.toString()).toEqual(originalValue);
  });
});
