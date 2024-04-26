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
import * as requestUtils from '../request-utils';
import { HttpStart } from 'opensearch-dashboards/public';

describe('RequestContext', () => {
  let httpMock: HttpStart;

  beforeEach(() => {
    // Mocking HttpStart
    httpMock = {
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should error if no dataSourceId is passed', () => {
    expect(() => createRequestContextWithDataSourceId()).toThrowError();
  });

  it('should have the correct query based on the passed dataSourceId', () => {
    const context = requestUtils.createRequestContextWithDataSourceId('test');
    expect(context.query).toEqual({ dataSourceId: 'test' });
  });

  it('should have the correct query based on local cluster context', () => {
    const context = requestUtils.createLocalClusterRequestContext();
    expect(context.query).toEqual({ dataSourceId: '' });
  });
});
