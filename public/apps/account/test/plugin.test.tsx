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

import { interceptError } from '../../../utils/logout-utils';
import { setShouldShowTenantPopup } from '../../../utils/storage-utils';
import { LOGIN_PAGE_URI } from '../../../../common';

jest.mock('../../../utils/storage-utils', () => ({
  setShouldShowTenantPopup: jest.fn(),
}));

describe('Intercept error handler', () => {
  const fakeError401 = {
    response: {
      status: 401,
    },
  };

  const fakeError400 = {
    response: {
      status: 400,
    },
  };

  it('Intercept error handler Should call setShouldShowTenantPopup on session timeout', () => {
    const sessionTimeoutFn = interceptError(LOGIN_PAGE_URI, window);
    sessionTimeoutFn(fakeError401, null);
    expect(setShouldShowTenantPopup).toBeCalledTimes(1);
  });

  it('Intercept error handler Should not call setShouldShowTenantPopup on session timeout', () => {
    const sessionTimeoutFn = interceptError(LOGIN_PAGE_URI, window);
    sessionTimeoutFn(fakeError400, null);
    expect(setShouldShowTenantPopup).toBeCalledTimes(0);
  });
});
