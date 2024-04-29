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

import { getClusterInfo, getDataSourceFromUrl, setDataSourceInUrl } from '../datasource-utils';

describe('Tests datasource utils', () => {
  it('Tests the GetClusterDescription helper function', () => {
    expect(getClusterInfo(false, { id: 'blah', label: 'blah' })).toBe('');
    expect(getClusterInfo(true, { id: '', label: '' })).toBe('for Local cluster');
    expect(getClusterInfo(true, { id: 'test', label: 'test' })).toBe('for test');
  });

  it('Tests getting the datasource from the url', () => {
    const mockSearchNoDataSourceId = '?foo=bar&baz=qux';
    Object.defineProperty(window, 'location', {
      value: { search: mockSearchNoDataSourceId },
      writable: true,
    });
    expect(getDataSourceFromUrl()).toEqual({ id: '', label: 'Local cluster' });
    const mockSearchDataSourceIdNotfirst =
      '?foo=bar&baz=qux&dataSource=%7B"id"%3A"94ffa650-f11a-11ee-a585-793f7b098e1a"%2C"label"%3A"9202"%7D';
    Object.defineProperty(window, 'location', {
      value: { search: mockSearchDataSourceIdNotfirst },
      writable: true,
    });
    expect(getDataSourceFromUrl()).toEqual({
      id: '94ffa650-f11a-11ee-a585-793f7b098e1a',
      label: '9202',
    });
    const mockSearchDataSourceIdFirst =
      '?dataSource=%7B"id"%3A"94ffa650-f11a-11ee-a585-793f7b098e1a"%2C"label"%3A"9202"%7D';
    Object.defineProperty(window, 'location', {
      value: { search: mockSearchDataSourceIdFirst },
      writable: true,
    });
    expect(getDataSourceFromUrl()).toEqual({
      id: '94ffa650-f11a-11ee-a585-793f7b098e1a',
      label: '9202',
    });
  });

  it('Tests setting the datasource in the url', () => {
    const replaceState = jest.fn();
    const mockUrl = 'http://localhost:5601/app/security-dashboards-plugin#/auth';
    Object.defineProperty(window, 'location', {
      value: { href: mockUrl },
      writable: true,
    });
    Object.defineProperty(window, 'history', {
      value: { replaceState },
      writable: true,
    });
    setDataSourceInUrl({ id: '', label: 'Local cluster' });
    expect(replaceState).toBeCalledWith(
      {},
      '',
      'http://localhost:5601/app/security-dashboards-plugin?dataSource=%7B%22id%22%3A%22%22%2C%22label%22%3A%22Local+cluster%22%7D#/auth'
    );
  });
});
