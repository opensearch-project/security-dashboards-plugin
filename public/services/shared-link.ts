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
import { CoreStart } from 'opensearch-dashboards/public';
import { API_ENDPOINT_MULTITENANCY } from '../apps/configuration/constants';

export async function addTenantToShareURL(core: CoreStart) {
  let tenant = '';

  try {
    tenant = await core.http.get(API_ENDPOINT_MULTITENANCY);

    if (!tenant) {
      tenant = 'global';
    } else if (tenant === '__user__') {
      tenant = 'private';
    }
  } catch (error) {
    console.log(`failed to get user tenant: ${error}`);
    return;
  }

  document.addEventListener('copy', (event) => {
    processCopyEvent(tenant);
  });
}

export function processCopyEvent(userRequestedTenant: string) {
  const shareButton = document.querySelector('[data-share-url]') as any;
  const target = document.querySelector('body > span');

  // The copy event listens to Cmd + C too, so we need to make sure
  // that we're actually copied something via the share panel
  if (shareButton && target && shareButton.getAttribute('data-share-url') === target.textContent) {
    const originalValue = target.textContent;
    let urlPart = originalValue;

    // We need to figure out where in the value to add the tenant.
    // Since OpenSearchDashboards sometimes adds values that aren't in the current location/url,
    // we need to use the actual input values to do a sanity check.
    try {
      // For the iFrame urls we need to parse out the src
      if (originalValue && originalValue.toLowerCase().indexOf('<iframe') === 0) {
        const regex = /<iframe[^>]*src="([^"]*)"/i;
        const match = regex.exec(originalValue);
        if (match) {
          urlPart = match[1]; // Contains the matched src, [0] contains the string where the match was found
        }
      }

      updateClipboard(urlPart, originalValue, userRequestedTenant);
    } catch (error) {
      // Probably wasn't an url, so we just ignore this
    }
  }
}

export function updateClipboard(
  urlPart: string,
  originalValue: string | undefined,
  tenant: string
) {
  const target = document.querySelector('body > span');

  if (!originalValue) {
    originalValue = urlPart;
  }

  const originalUrl = new URL(urlPart);
  if (originalUrl.searchParams?.has('security_tenant')) {
    return originalValue;
  }
  originalUrl.searchParams.append('security_tenant', tenant);

  const originalValueWithTenant = originalValue.replace(urlPart, originalUrl.toString());

  setClipboardAndTarget(target, originalValueWithTenant, originalValue);
}

export function setClipboardAndTarget(target: any, newValue: string, originalValue: string) {
  let range = document.createRange() as any;
  const referenceNode = target;

  const selection = document.getSelection();
  if (selection?.rangeCount === 1) {
    range = selection.getRangeAt(0);
  }

  range.selectNode(referenceNode);
  selection?.removeAllRanges();

  if (newValue !== originalValue) {
    target.textContent = newValue;
  }

  selection?.addRange(range);
}
