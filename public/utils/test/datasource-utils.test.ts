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

import { createDataSourceQuery, getClusterInfoIfEnabled } from '../datasource-utils';

describe('Tests datasource utils', () => {
  it('Tests the GetClusterDescription helper function', () => {
    expect(getClusterInfoIfEnabled(false, { id: 'blah', label: 'blah' })).toBe('');
    expect(getClusterInfoIfEnabled(true, { id: '', label: '' })).toBe('for Local cluster');
    expect(getClusterInfoIfEnabled(true, { id: 'test', label: 'test' })).toBe('for test');
  });

  it('Tests the create DataSource query helper function', () => {
    expect(createDataSourceQuery('test')).toStrictEqual({ dataSourceId: 'test' });
  });
});
