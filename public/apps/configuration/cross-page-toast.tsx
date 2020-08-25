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
import { useLocation } from 'react-router-dom';
import { EuiGlobalToastList } from '@elastic/eui';
import { useToastState } from './utils/toast-utils';
import { getAndClearCrossPageToast } from './utils/storage-utils';

export function CrossPageToast() {
  // For cross page toast
  const [toasts, addToast, removeToast] = useToastState();

  const location = useLocation();
  React.useEffect(() => {
    const toast = getAndClearCrossPageToast(location.pathname);
    if (toast) {
      addToast(toast);
    }
  }, [addToast, location]);

  return <EuiGlobalToastList toasts={toasts} toastLifeTimeMs={10000} dismissToast={removeToast} />;
}
