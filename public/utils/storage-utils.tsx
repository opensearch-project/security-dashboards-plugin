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

const PREFIX = 'opendistro::security';

export function getValue<T>(storage: Storage, category: string, key: string): T | null {
  if (!storage) {
    return null;
  }
  const item = storage.getItem(`${PREFIX}::${category}::${key}`);
  if (!item) {
    return null;
  }
  return JSON.parse(item) as T;
}

export function setValue(storage: Storage, category: string, key: string, value: any) {
  if (!storage) {
    return;
  }
  storage.setItem(`${PREFIX}::${category}::${key}`, JSON.stringify(value));
}

/*
 * For cross page toasts
 */

const TOAST_CATEGORY = 'toast';

export function setCrossPageToast(targetUrl: string, toast: Toast) {
  setValue(sessionStorage, TOAST_CATEGORY, targetUrl, toast);
}

export function getAndClearCrossPageToast(targetUrl: string): Toast | null {
  const result = getValue<Toast>(sessionStorage, TOAST_CATEGORY, targetUrl);
  setValue(sessionStorage, TOAST_CATEGORY, targetUrl, null);
  return result;
}

/*
 * For tenant selection prompt
 */

const TENANT_CATEGORY = 'tenant';
const TENANT_SHOW_POPUP_KEY = 'show_popup';
const TENANT_SAVED_KEY = 'saved';

export function getShouldShowTenantPopup(): boolean | null {
  return getValue<boolean>(sessionStorage, TENANT_CATEGORY, TENANT_SHOW_POPUP_KEY);
}

export function setShouldShowTenantPopup(value: boolean | null): void {
  setValue(sessionStorage, TENANT_CATEGORY, TENANT_SHOW_POPUP_KEY, value);
}

export function getSavedTenant(): string | null {
  return getValue<string>(localStorage, TENANT_CATEGORY, TENANT_SAVED_KEY);
}

export function setSavedTenant(value: string | null): void {
  setValue(localStorage, TENANT_CATEGORY, TENANT_SAVED_KEY, value);
}
