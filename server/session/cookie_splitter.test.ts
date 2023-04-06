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
import { Request as HapiRequest, ResponseObject as HapiResponseObject } from '@hapi/hapi';
import { httpServerMock } from '../../../../src/core/server/http/http_server.mocks';
import {
  clearSplitCookies,
  getExtraAuthStorageValue,
  setExtraAuthStorage,
  splitValueIntoCookies,
  unsplitCookiesIntoValue,
} from './cookie_splitter';
import { OpenSearchDashboardsRequest } from '../../../../src/core/server/http/router';
import { deflateValue } from '../utils/compression';

type CookieAuthWithResponseObject = Partial<HapiRequest['cookieAuth']> & {
  h: Partial<HapiResponseObject>;
};

describe('Test extra auth storage', () => {
  test('the cookie value is split up into multiple cookies', async () => {
    const cookiePrefix = 'testcookie';
    const additionalCookies = 2;

    const mockRequest = httpServerMock.createRawRequest();
    (mockRequest.cookieAuth as CookieAuthWithResponseObject) = {
      h: {
        state: jest.fn(),
        unstate: jest.fn(),
      },
    };

    const osRequest = OpenSearchDashboardsRequest.from(mockRequest);

    setExtraAuthStorage(osRequest, 'THIS IS MY VALUE', {
      cookiePrefix,
      additionalCookies,
    });

    const cookieAuth = mockRequest.cookieAuth as CookieAuthWithResponseObject;
    expect(cookieAuth.h.state).toHaveBeenCalledTimes(1);
    expect(cookieAuth.h.state).toHaveBeenCalledWith(cookiePrefix + '1', expect.anything());
  });

  test('cookies are stitched together and inflated', async () => {
    const cookiePrefix = 'testcookie';
    const additionalCookies = 2;

    const testString = 'abcdefghi';
    const testStringBuffer: Buffer = deflateValue(testString);
    const cookieValue = testStringBuffer.toString('base64');

    const splitValueAt = Math.ceil(cookieValue.length / additionalCookies);
    const mockRequest = httpServerMock.createRawRequest({
      state: {
        [cookiePrefix + '1']: cookieValue.substring(0, splitValueAt),
        [cookiePrefix + '2']: cookieValue.substring(splitValueAt),
      },
    });

    (mockRequest.cookieAuth as CookieAuthWithResponseObject) = {
      h: {
        state: jest.fn(),
        unstate: jest.fn(),
      },
    };

    const osRequest = OpenSearchDashboardsRequest.from(mockRequest);

    const extraStorageValue = getExtraAuthStorageValue(osRequest, {
      cookiePrefix,
      additionalCookies,
    });

    expect(extraStorageValue).toEqual(testString);
  });

  /**
   * Should calculate the number of cookies correctly.
   * Any cookies required should be unstated
   */
  test('number of cookies used is correctly calculated', async () => {
    const cookiePrefix = 'testcookie';
    const additionalCookies = 5;

    // 4000 bytes would require two cookies
    const cookieValue = 'a'.repeat(4000);

    const mockRequest = httpServerMock.createRawRequest({
      state: {
        [cookiePrefix + '1']: 'should be overridden',
        [cookiePrefix + '2']: 'should be overridden',
        [cookiePrefix + '3']: 'should be unstated',
        [cookiePrefix + '4']: 'should be unstated',
        [cookiePrefix + '5']: 'should be unstated',
      },
    });

    (mockRequest.cookieAuth as CookieAuthWithResponseObject) = {
      h: {
        state: jest.fn(),
        unstate: jest.fn(),
      },
    };

    const osRequest = OpenSearchDashboardsRequest.from(mockRequest);

    splitValueIntoCookies(osRequest, cookiePrefix, cookieValue, additionalCookies);

    const cookieAuth = mockRequest.cookieAuth as CookieAuthWithResponseObject;
    expect(cookieAuth.h.state).toHaveBeenCalledTimes(2);
    expect(cookieAuth.h.unstate).toHaveBeenCalledTimes(3);
  });

  test('clear all cookies', async () => {
    const cookiePrefix = 'testcookie';
    const additionalCookies = 5;

    const mockRequest = httpServerMock.createRawRequest({
      state: {
        [cookiePrefix + '1']: 'should be unstated',
        [cookiePrefix + '2']: 'should be unstated',
        [cookiePrefix + '3']: 'should be unstated',
      },
    });

    (mockRequest.cookieAuth as CookieAuthWithResponseObject) = {
      h: {
        state: jest.fn(),
        unstate: jest.fn(),
      },
    };

    const osRequest = OpenSearchDashboardsRequest.from(mockRequest);

    clearSplitCookies(osRequest, {
      cookiePrefix,
      additionalCookies,
    });

    const cookieAuth = mockRequest.cookieAuth as CookieAuthWithResponseObject;
    // Only 3 out of 5 cookies set in the request
    expect(cookieAuth.h.unstate).toHaveBeenCalledTimes(3);
  });

  test('should unsplit cookies', async () => {
    const cookiePrefix = 'testcookie';
    const additionalCookies = 5;

    const mockRequest = httpServerMock.createRawRequest({
      state: {
        [cookiePrefix + '1']: 'abc',
        [cookiePrefix + '2']: 'def',
        [cookiePrefix + '3']: 'ghi',
      },
    });

    const osRequest = OpenSearchDashboardsRequest.from(mockRequest);
    const unsplitValue = unsplitCookiesIntoValue(osRequest, cookiePrefix, additionalCookies);

    expect(unsplitValue).toEqual('abcdefghi');
  });
});
