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

import { fetchUserNameList, getUserList, transformUserData } from '../internal-user-list-utils';
import { httpGet } from '../request-utils';
import * as InternalUserListUtils from '../internal-user-list-utils';

jest.mock('../../utils/request-utils', () => ({
  httpGet: jest.fn().mockResolvedValue({ data: {} }),
}));

describe('Internal user list utils', () => {
  const userList = {
    attributes: { attribute1: 'value1', attribute2: 'value2' },
    backend_roles: ['backendRole1', 'backendRole2'],
  };

  it('transform user list', () => {
    const result = transformUserData({ user1: userList });
    const expectedUserList = [
      {
        username: 'user1',
        attributes: userList.attributes,
        backend_roles: userList.backend_roles,
      },
    ];
    expect(result).toEqual(expectedUserList);
  });

  it('getUserList calls httpGet with the correct parameters for internal users', async () => {
    const httpMock = {}; // Mock HttpStart object
    const userType = 'internalaccounts';
    const query = { dataSourceId: 'test' };

    // Mock the response data from httpGet
    const mockRawData = {
      data: {
        // your mocked data here
      },
    };

    // Mock the return value of getUserListRaw
    jest.spyOn(InternalUserListUtils, 'getUserListRaw').mockResolvedValue(mockRawData);

    // Call the function you want to test
    const test = await getUserList(httpMock, userType, query);

    // Assert that httpGet was called with the correct parameters
    expect(httpGet).toHaveBeenCalledWith({
      http: httpMock,
      url: '/api/v1/configuration/internalaccounts',
      query,
    });
    expect(test).toEqual([]);
  });

  it('getUserList calls httpGet with the correct parameters for service accounts', async () => {
    const httpMock = {}; // Mock HttpStart object
    const userType = 'serviceAccounts';
    const query = { dataSourceId: 'test' };

    // Mock the response data from httpGet
    const mockRawData = {
      data: {},
    };

    // Mock the return value of getUserListRaw
    jest.spyOn(InternalUserListUtils, 'getUserListRaw').mockResolvedValue(mockRawData);

    // Call the function you want to test
    const test = await getUserList(httpMock, userType, query);

    // Assert that httpGet was called with the correct parameters
    expect(httpGet).toHaveBeenCalledWith({
      http: httpMock,
      url: '/api/v1/configuration/serviceaccounts',
      query,
    });
    expect(test).toEqual([]);
  });

  it('fetchUserNameList calls httpGet with the correct parameters for service accounts', async () => {
    const httpMock = {}; // Mock HttpStart object
    const userType = 'serviceAccounts';

    // Mock the response data from httpGet
    const mockRawData = {
      data: {},
    };

    // Mock the return value of getUserListRaw
    jest.spyOn(InternalUserListUtils, 'getUserListRaw').mockResolvedValue(mockRawData);

    // Call the function you want to test
    const test = await fetchUserNameList(httpMock, userType);

    // Assert that httpGet was called with the correct parameters
    expect(httpGet).toHaveBeenCalledWith({
      http: httpMock,
      url: '/api/v1/configuration/serviceaccounts',
    });
    expect(test).toEqual([]);
  });

  it('fetchUserNameList calls httpGet with the correct parameters for internal users', async () => {
    const httpMock = {}; // Mock HttpStart object
    const userType = 'internalaccounts';

    // Mock the response data from httpGet
    const mockRawData = {
      data: {},
    };

    // Mock the return value of getUserListRaw
    jest.spyOn(InternalUserListUtils, 'getUserListRaw').mockResolvedValue(mockRawData);

    // Call the function you want to test
    const test = await fetchUserNameList(httpMock, userType);

    // Assert that httpGet was called with the correct parameters
    expect(httpGet).toHaveBeenCalledWith({
      http: httpMock,
      url: '/api/v1/configuration/internalaccounts',
    });
    expect(test).toEqual([]);
  });
});
