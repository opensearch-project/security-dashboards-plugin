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
 * Build hash based url, encode the resourceId part
 * e.g.
 *   buildUrl() => "/" (landing page)
 *   buildUrl(ResourceType.roles) => "/roles" (role listing page)
 *   buildUrl(ResourceType.roles, Action.create) => "/roles/create" (role creation page)
 *   buildUrl(ResourceType.roles, Action.view, "../someRole") => "/roles/view/..%2FsomeRole" (role detail page)
 *   buildUrl(ResourceType.roles, Action.view, "someRole", SubAction.mapuser) => "/roles/view/someRole/mapuser" (Map User page)
 * edge case (wrong usage) fallbacks:
 *   buildUrl(undefined, Action.create) => ""
 *   buildUrl(ResourceType.roles, undefined, "someRole") => "/roles"
 */
export function buildUrl(
  resouceType?: ResourceType,
  action?: Action,
  resourceId?: string,
  subAction?: string
) {
  const encodedResouceId = resourceId ? encodeURIComponent(resourceId) : undefined;
  const rawContents = [resouceType, action, encodedResouceId, subAction];
  const contents = [];
  for (const content of rawContents) {
    if (content === undefined) {
      break;
    }
    contents.push(content);
  }
  return '/' + contents.join('/');
}

export function buildHashUrl(
  resouceType?: ResourceType,
  action?: Action,
  resourceId?: string,
  subAction?: string
) {
  return '#' + buildUrl(resouceType, action, resourceId, subAction);
}
