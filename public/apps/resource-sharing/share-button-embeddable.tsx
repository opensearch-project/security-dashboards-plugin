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

import type { CoreStart } from '../../../../../src/core/public';
import type { ResourceShareButtonProps } from './resource-share-button';

export type { ResourceShareButtonProps } from './resource-share-button';

/**
 * Builds the embeddable ShareButton component exposed on the security plugin's
 * start contract. The heavy implementation (EUI modal etc.) is loaded lazily,
 * so consumer plugins only pay the cost when the button is actually rendered.
 *
 * @param core CoreStart used for http and toasts
 * @param resourceSharingEnabled when false, the returned component renders nothing
 */
export const createShareButton = (
  core: CoreStart,
  resourceSharingEnabled: boolean
): React.ComponentType<ResourceShareButtonProps> => {
  if (!resourceSharingEnabled) {
    return () => null;
  }

  const LazyResourceShareButton = React.lazy(() =>
    import('./resource-share-button').then((m) => ({ default: m.ResourceShareButton }))
  );

  return (props: ResourceShareButtonProps) => (
    <React.Suspense fallback={null}>
      <LazyResourceShareButton {...props} http={core.http} notifications={core.notifications} />
    </React.Suspense>
  );
};
