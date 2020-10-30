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

function redirect(serverBasePath: string) {
  // navigate to nextUrl
  const urlParams = new URLSearchParams(window.location.search);
  let nextUrl = urlParams.get('nextUrl');
  if (!nextUrl || nextUrl.toLowerCase().includes('//')) {
    nextUrl = serverBasePath;
  }
  window.location.href = nextUrl + window.location.hash;
}

function tenantSpecifiedInUrl() {
  return (
    window.location.search.includes('security_tenant') ||
    window.location.search.includes('securitytenant')
  );
}

export async function renderPage(
  coreStart: CoreStart,
  params: AppMountParameters,
  config: ClientConfigType,
  hasApiPermission?: boolean
) {
  const serverBasePath: string = coreStart.http.basePath.serverBasePath;
  const handleModalClose = () => redirect(serverBasePath);
  // Skip either:
  // 1. multitenancy is disabled
  // 2. security manager (user with api permission)
  if (!config.multitenancy.enabled || hasApiPermission || tenantSpecifiedInUrl()) {
    handleModalClose();
    return () => {};
  } else {
    ReactDOM.render(
      <TenantSwitchPanel
        coreStart={coreStart}
        config={config}
        handleClose={handleModalClose}
        handleSwitchAndClose={handleModalClose}
      />,
      params.element
    );
    return () => ReactDOM.unmountComponentAtNode(params.element);
  }
}
