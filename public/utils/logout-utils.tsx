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

import { setShouldShowTenantPopup } from './storage-utils';
import {
  HttpInterceptorResponseError,
  IHttpInterceptController,
} from '../../../../src/core/public';
import { CUSTOM_ERROR_PAGE_URI, LOGIN_PAGE_URI } from '../../common';

export function interceptError(logoutUrl: string, thisWindow: Window): any {
  return (httpErrorResponse: HttpInterceptorResponseError, _: IHttpInterceptController) => {
    if (httpErrorResponse.response?.status === 401) {
      setShouldShowTenantPopup(null);
      if (
        !(
          thisWindow.location.pathname.toLowerCase().includes(LOGIN_PAGE_URI) ||
          thisWindow.location.pathname.toLowerCase().includes(CUSTOM_ERROR_PAGE_URI)
        )
      ) {
        if (logoutUrl) {
          thisWindow.location.href = logoutUrl;
        } else {
          // when session timed out, user credentials in cookie are wiped out
          // refres the page will direct the user to go through login process
          thisWindow.location.reload();
        }
      }
    }
  };
}
