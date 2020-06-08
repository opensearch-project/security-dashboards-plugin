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

import { ResourceType, Action } from '../types';

/**
 * Build hash based url.
 * e.g.
 *   buildUrl() => "/" (landing page)
 *   buildUrl(ResourceType.roles) => "/roles" (role listing page)
 *   buildUrl(ResourceType.roles, Action.new) => "/roles/create" (role creation page)
 *   buildUrl(ResourceType.roles, Action.view, "readall") => "/roles/view/readall" (role detail page)
 * edge case (wrong usage) fallbacks:
 *   buildUrl(undefined, Action.new) => ""
 *   buildUrl(ResourceType.roles, undefined, "readall") => "/roles"
 */
export function buildUrl(resouceType?: ResourceType, action?: Action, resourceId?: string) {
  const rawContents = [resouceType, action, resourceId];
  const contents = [];
  for (const content of rawContents) {
    if (content === undefined) {
      break;
    }
    contents.push(content);
  }
  return '/' + contents.join('/');
}

export function buildHashUrl(resouceType?: ResourceType, action?: Action, resourceId?: string) {
  return '#' + buildUrl(resouceType, action, resourceId);
}
