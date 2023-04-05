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
import { getExtraAuthStorageValue, setExtraAuthStorage } from './cookie_splitter';
import { OpenSearchDashboardsRequest } from '../../../../src/core/server/http/router';
import { deflateValue } from '../utils/compression';

type CookieAuthWithResponseObject = Partial<HapiRequest['cookieAuth']> & {
  h: Partial<HapiResponseObject>;
};

describe('Test extra auth storage', () => {
  test('Cookies are written', async () => {
    const mockRequest = httpServerMock.createRawRequest();
    (mockRequest.cookieAuth as CookieAuthWithResponseObject) = {
      h: {
        state: jest.fn(),
        unstate: jest.fn(),
      },
    };

    const osRequest = OpenSearchDashboardsRequest.from(mockRequest);

    // I need to setup the cookies?????
    setExtraAuthStorage(osRequest, 'THIS IS MY VALUE', {
      cookiePrefix: 'testcookie',
      additionalCookies: 2,
    });

    expect((mockRequest.cookieAuth as CookieAuthWithResponseObject).h.state).toHaveBeenCalledTimes(
      1
    );
    expect((mockRequest.cookieAuth as CookieAuthWithResponseObject).h.state).toHaveBeenCalledWith(
      'testcookie1',
      expect.anything()
    );
  });

  test('Cookies are stitched together and inflated', async () => {
    const testString = 'abcdefghi';
    const testStringBuffer: Buffer = deflateValue(testString);
    const cookieValue = testStringBuffer.toString('base64');
    const additionalCookies = 2;
    const splitValueAt = Math.ceil(cookieValue.length / additionalCookies);
    const mockRequest = httpServerMock.createRawRequest({
      state: {
        testcookie1: cookieValue.substring(0, splitValueAt),
        testcookie: cookieValue.substring(splitValueAt),
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
      cookiePrefix: 'testcookie',
      additionalCookies,
    });

    expect(extraStorageValue).toEqual(testString);
  });
});
