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

import { EuiBreadcrumb } from '@elastic/eui';
import { ResourceType } from 'plugins/security-dashboards-plugin/common';
import { buildHashUrl } from './url-builder';
import { ROUTE_MAP } from '../app-router';

export function generateResourceName(action: string, sourceResourceName: string): string {
  switch (action) {
    case 'edit':
      return sourceResourceName;
    case 'duplicate':
      return sourceResourceName + '_copy';
    default:
      return '';
  }
}

export function getResourceUrl(endpoint: string, resourceName: string) {
  return endpoint + '/' + encodeURIComponent(resourceName);
}

export function getBreadcrumbs(
  includeSecurityBase: boolean,
  resourceType?: ResourceType,
  pageTitle?: string,
  subAction?: string
): EuiBreadcrumb[] {
  const breadcrumbs: EuiBreadcrumb[] = includeSecurityBase
    ? [
        {
          text: 'Security',
          href: buildHashUrl(),
        },
      ]
    : [];

  if (resourceType) {
    if (includeSecurityBase) {
      breadcrumbs.push({
        text: ROUTE_MAP[resourceType].name,
        href: buildHashUrl(resourceType),
      });
    } else {
      breadcrumbs.push({
        text: ROUTE_MAP[resourceType].displayNameWithoutSecurityBase,
        href: buildHashUrl(resourceType),
      });
    }
  }

  if (pageTitle) {
    breadcrumbs.push({
      text: pageTitle,
    });
  }

  if (subAction) {
    breadcrumbs.push({
      text: subAction,
    });
  }
  return breadcrumbs;
}
