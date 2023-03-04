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
      putIndexTemplate: jest.fn().mockImplementation((template) => {
        return template;
      }),
    },
  };

  const priority = MAX_INTEGER;

  it('put index template', () => {
    const result = mockOpenSearchClient.indices.putIndexTemplate({
      name: 'test_index_template_a',
      body: {
        priority,
        index_patterns: 'test_index_patterns_a',
        template: {
          settings: {
            number_of_shards: 1,
          },
        },
      },
    });
    expect(result.body.priority).toEqual(priority);
  });
});
