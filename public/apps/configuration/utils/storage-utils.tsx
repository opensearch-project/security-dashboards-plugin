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

import { Toast } from '@elastic/eui/src/components/toast/global_toast_list';

/*
 * This file leverage storage for frontend data. Currently it is for cross page toasts only,
 * so session storage is in use (no need to hold the toast message to until next session)
 */

export function getValue<T>(category: string, key: string): T | null {
  const item = sessionStorage.getItem(`${category}::${key}`);
  if (!item) {
    return null;
  }
  return JSON.parse(item) as T;
}

export function setValue(category: string, key: string, value: any) {
  sessionStorage.setItem(`${category}::${key}`, JSON.stringify(value));
}

const TOAST_CATEGORY = 'toast';

export function setCrossPageToast(targetUrl: string, toast: Toast) {
  setValue(TOAST_CATEGORY, targetUrl, toast);
}

export function getAndClearCrossPageToast(targetUrl: string): Toast | null {
  const result = getValue<Toast>(TOAST_CATEGORY, targetUrl);
  setValue(TOAST_CATEGORY, targetUrl, null);
  return result;
}
