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

import React from 'react';
import ReactDOM from 'react-dom';
import { CoreStart } from 'opensearch-dashboards/public';
import { AccountNavButton } from './account-nav-button';
import { fetchAccountInfoSafe } from './utils';
import { ClientConfigType } from '../../types';
import { CUSTOM_ERROR_PAGE_URI, ERROR_MISSING_ROLE_PATH } from '../../../common';
import { selectTenant } from '../configuration/utils/tenant-utils';
import {
  getSavedTenant,
  getShouldShowTenantPopup,
  setShouldShowTenantPopup,
} from '../../utils/storage-utils';
import { constructErrorMessageAndLog } from '../error-utils';

function tenantSpecifiedInUrl() {
  return (
    window.location.search.includes('security_tenant') ||
    window.location.search.includes('securitytenant')
  );
}

export async function setupTopNavButton(coreStart: CoreStart, config: ClientConfigType) {
  const accountInfo = (await fetchAccountInfoSafe(coreStart.http))?.data;
  if (accountInfo) {
    // Missing role error
    if (accountInfo.roles.length === 0 && !window.location.href.includes(CUSTOM_ERROR_PAGE_URI)) {
      window.location.href =
        coreStart.http.basePath.serverBasePath + CUSTOM_ERROR_PAGE_URI + ERROR_MISSING_ROLE_PATH;
    }

    let tenant = accountInfo.user_requested_tenant;
    let shouldShowTenantPopup = true;

    if (tenantSpecifiedInUrl() || getShouldShowTenantPopup() === false) {
      shouldShowTenantPopup = false;
    } else {
      // Switch to previous tenant based on localStorage, it may fail due to
      // 1) Localstorage is disabled; 2) Request failed
      try {
        const savedTenant = getSavedTenant();
        if (savedTenant !== null) {
          if (savedTenant === tenant) {
            shouldShowTenantPopup = false;
          } else {
            await selectTenant(coreStart.http, {
              username: accountInfo.user_name,
              tenant: savedTenant,
            });
            tenant = savedTenant;
            shouldShowTenantPopup = false;
            window.location.reload();
          }
        }
      } catch (e) {
        constructErrorMessageAndLog(e, `Failed to switch to ${tenant} tenant.`);
      }
    }

    setShouldShowTenantPopup(shouldShowTenantPopup);

    coreStart.chrome.navControls.registerRight({
      // Pin to rightmost, since newsfeed plugin is using 1000, here needs a number > 1000
      order: 2000,
      mount: (element: HTMLElement) => {
        ReactDOM.render(
          <AccountNavButton
            coreStart={coreStart}
            isInternalUser={accountInfo.is_internal_user}
            username={accountInfo.user_name}
            tenant={tenant}
            config={config}
          />,
          element
        );
        return () => ReactDOM.unmountComponentAtNode(element);
      },
    });
  }
}
