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

import { MAX_INTEGER } from '../../../common';

describe('Tenant index template', () => {
  const mockOpenSearchClient = {
    indices: {
      putTemplate: jest.fn().mockImplementation((template) => {
        return template;
      }),
    },
  };

  const order = MAX_INTEGER;

  it('put template', () => {
    const result = mockOpenSearchClient.indices.putTemplate({
      name: 'test_index_template_a',
      body: {
        order,
        index_patterns: 'test_index_patterns_a',
        mappings: {
          dynamic: 'strict',
          properties: { baz: { type: 'text' } },
        },
      },
    });
    expect(result.body.order).toEqual(order);
  });
});
