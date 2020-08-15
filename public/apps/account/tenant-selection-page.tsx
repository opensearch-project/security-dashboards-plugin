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
import { AppMountParameters, CoreStart } from '../../../../../src/core/public';
import { ClientConfigType } from '../../types';
import { TenantSwitchPanel } from './tenant-switch-panel';

function handleModalClose(serverBasePath: string) {
  // navigate to nextUrl
  const urlParams = new URLSearchParams(window.location.search);
  const nextUrl = urlParams.get('nextUrl') || serverBasePath;
  window.location.href = nextUrl;
}

export async function renderPage(
  coreStart: CoreStart,
  params: AppMountParameters,
  config: ClientConfigType,
  hasApiPermission?: boolean
) {
  const serverBasePath: string = coreStart.http.basePath.serverBasePath;
  // Skip either:
  // 1. multitenancy is disabled
  // 2. security manager (user with api permission)
  if (!config.multitenancy.enabled || hasApiPermission) {
    handleModalClose(serverBasePath);
    return () => {};
  } else {
    ReactDOM.render(
      <TenantSwitchPanel
        coreStart={coreStart}
        config={config}
        handleClose={() => handleModalClose(serverBasePath)}
      />,
      params.element
    );
    return () => ReactDOM.unmountComponentAtNode(params.element);
  }
}
