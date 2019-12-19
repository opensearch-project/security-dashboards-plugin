/*
 * Copyright 2015-2018 _floragunn_ GmbH
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */
/*
 * Portions Copyright 2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License").
 * You may not use this file except in compliance with the License.
 * A copy of the License is located at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * or in the "license" file accompanying this file. This file is distributed
 * on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either
 * express or implied. See the License for the specific language governing
 * permissions and limitations under the License.
 */

import React from 'react';
import ReactDOM from 'react-dom';
import { chromeHeaderNavControlsRegistry } from 'ui/registry/chrome_header_nav_controls';

import chrome from 'ui/chrome';
import { EuiButtonEmpty } from '@elastic/eui';

if (chrome.getInjected('auth.type') !== 'kerberos' && chrome.getInjected('auth.type') !== 'proxy') {
  chromeHeaderNavControlsRegistry.register((securityAccessControl) => ({
    name: 'btn-logout',
    order: 1000,
    side: 'right',
    render(el) {
      function onClick() {
        securityAccessControl.logout();
      }
      const chromeInjected = chrome.getInjected();
      let logoutButtonLabel = "Logout";
      if (chromeInjected && chromeInjected.securityDynamic && chromeInjected.securityDynamic.user) {
        if (!chromeInjected.securityDynamic.user.isAnonymousAuth) {
          logoutButtonLabel = chromeInjected.securityDynamic.user.username;
        } else {
          logoutButtonLabel = "Login";
        }
      }
      //console.log(ctrl.username);
      ReactDOM.render(
        <div className="kbnGlobalNavLink__icon" style={{padding: "15px"}} onClick={onClick}>
            <i className="fa fa-sign-out securityLogoutLink__icon-image"></i> {logoutButtonLabel}
        </div>,
        el
      );
      return () => ReactDOM.unmountComponentAtNode(el);
    }
  }));
}
