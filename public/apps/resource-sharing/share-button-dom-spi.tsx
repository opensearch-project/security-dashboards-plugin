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

import React from 'react';
import ReactDOM from 'react-dom';

import type { CoreStart } from '../../../../../src/core/public';

/**
 * DOM-marker SPI for the centralized resource share button.
 *
 * Mirrors the backend's ResourceSharingExtension SPI philosophy on the UI
 * side: a plugin "implements the interface" by emitting a marker element
 * wherever it wants the share button; this module discovers markers and
 * fulfills them. Consumers need NO plugin dependency, NO imports, and NO
 * manifest changes — placement is fully theirs (page headers, table rows,
 * flyouts, ...).
 *
 * Contract — render an empty element carrying:
 *   data-resource-share-button                    (marker, required)
 *   data-resource-id="<resource id>"              (required)
 *   data-resource-type="<registered type>"        (required)
 *   data-resource-data-source-id="<MDS id>"       (optional)
 *
 * Example (JSX in any plugin, no imports needed):
 *   <div
 *     data-resource-share-button
 *     data-resource-id={detector.id}
 *     data-resource-type="anomaly-detector"
 *   />
 *
 * Behavior:
 * - When the security plugin is absent or resource sharing is disabled, the
 *   marker simply stays empty.
 * - The mounted button hides itself if the type is not registered/protected,
 *   and disables itself when the user lacks share permission.
 * - Markers added/removed dynamically (SPA navigation, table pagination) are
 *   tracked via MutationObserver; attribute changes re-mount the button.
 */

export const SHARE_BUTTON_MARKER_ATTR = 'data-resource-share-button';
export const RESOURCE_ID_ATTR = 'data-resource-id';
export const RESOURCE_TYPE_ATTR = 'data-resource-type';
export const DATA_SOURCE_ID_ATTR = 'data-resource-data-source-id';
/** Optional: human-readable resource name, shown in the modal instead of the id. */
export const RESOURCE_NAME_ATTR = 'data-resource-name';
/** Optional (presence): hide the Private/Shared status pill (e.g. on detail pages). */
export const HIDE_STATUS_ATTR = 'data-resource-hide-status';
/** Optional: "button" (default, labeled) or "icon" (compact, for table rows). */
export const DISPLAY_ATTR = 'data-resource-share-display';

const MARKER_SELECTOR = `[${SHARE_BUTTON_MARKER_ATTR}]`;

const LazyResourceShareButton = React.lazy(() =>
  import('./resource-share-button').then((m) => ({ default: m.ResourceShareButton }))
);

/**
 * Starts watching the document for share-button markers and mounts the
 * centralized ShareButton into them. Returns a teardown function.
 */
export function startShareButtonDomSpi(core: CoreStart): () => void {
  // element -> signature of the props currently mounted into it
  const mounted = new Map<Element, string>();

  const mountInto = (el: Element) => {
    const resourceId = el.getAttribute(RESOURCE_ID_ATTR);
    const resourceType = el.getAttribute(RESOURCE_TYPE_ATTR);
    if (!resourceId || !resourceType) return;
    const dataSourceId = el.getAttribute(DATA_SOURCE_ID_ATTR) || undefined;
    const resourceName = el.getAttribute(RESOURCE_NAME_ATTR) || undefined;
    const display = el.getAttribute(DISPLAY_ATTR) === 'icon' ? ('icon' as const) : undefined;
    const showStatus = !el.hasAttribute(HIDE_STATUS_ATTR);

    const signature = `${resourceId}|${resourceType}|${dataSourceId ?? ''}|${display ?? ''}|${
      resourceName ?? ''
    }|${showStatus}`;
    if (mounted.get(el) === signature) return;

    ReactDOM.render(
      <React.Suspense fallback={null}>
        <LazyResourceShareButton
          resourceId={resourceId}
          resourceType={resourceType}
          resourceName={resourceName}
          dataSourceId={dataSourceId}
          display={display}
          showStatus={showStatus}
          http={core.http}
          notifications={core.notifications}
        />
      </React.Suspense>,
      el as HTMLElement
    );
    mounted.set(el, signature);
  };

  const unmountFrom = (el: Element) => {
    ReactDOM.unmountComponentAtNode(el as HTMLElement);
    mounted.delete(el);
  };

  const scan = (root: Element) => {
    if (root.matches?.(MARKER_SELECTOR)) mountInto(root);
    root.querySelectorAll?.(MARKER_SELECTOR).forEach(mountInto);
  };

  const observer = new MutationObserver((records) => {
    for (const record of records) {
      if (record.type === 'attributes') {
        const target = record.target as Element;
        if (target.matches?.(MARKER_SELECTOR)) mountInto(target);
        continue;
      }
      record.addedNodes.forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE) scan(node as Element);
      });
      record.removedNodes.forEach((node) => {
        if (node.nodeType !== Node.ELEMENT_NODE) return;
        const removed = node as Element;
        for (const el of Array.from(mounted.keys())) {
          if (removed === el || removed.contains(el)) unmountFrom(el);
        }
      });
    }
  });

  scan(document.body);
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: [
      RESOURCE_ID_ATTR,
      RESOURCE_TYPE_ATTR,
      DATA_SOURCE_ID_ATTR,
      DISPLAY_ATTR,
      RESOURCE_NAME_ATTR,
      HIDE_STATUS_ATTR,
    ],
  });

  return () => {
    observer.disconnect();
    Array.from(mounted.keys()).forEach(unmountFrom);
  };
}
