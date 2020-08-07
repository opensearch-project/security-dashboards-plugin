/*
 *   Copyright 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
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
import { CoreStart } from '../../../../../src/core/public';
import { AccountNavButton } from './account-nav-button';
import { checkInternalUser } from './utils';

export async function setupTopNavButton(coreStart: CoreStart) {
  const isInternalUser = await checkInternalUser(coreStart);
  coreStart.chrome.navControls.registerRight({
    order: 2000,
    mount: (element: HTMLElement) => {
      ReactDOM.render(<AccountNavButton isInternalUser={isInternalUser} />, element);
      return () => ReactDOM.unmountComponentAtNode(element);
    },
  });
}
