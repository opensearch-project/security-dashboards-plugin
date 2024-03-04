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
import { CoreStart } from 'opensearch-dashboards/public';
import { ClusterSelector } from '../../../../../src/plugins/data_source_management/public';
import { SecurityPluginStartDependencies } from '../../types';

export async function setupClusterSelector(
  coreStart: CoreStart,
  deps: SecurityPluginStartDependencies
) {
  if (deps.dataSource?.dataSourceEnabled) {
    coreStart.chrome.navControls.registerRight({
      // Pin to left of the avatar, here needs a number < 1000
      // TODO: figure out how to show this only in the security plugin instead of being registered globally
      // Core may be working on an optional picker that gets exposed to all plugins
      // Leaving this as a TODO to figure out the rest of the flow, especially around changing context of API calls
      // in each specific tab.
      order: 500,
      mount: (element: HTMLElement) => {
        ReactDOM.render(
          <ClusterSelector
            savedObjectsClient={coreStart.savedObjects.client}
            notifications={coreStart.notifications}
            onSelectedDataSource={() => {}}
            disabled={false}
            hideLocalCluster={false}
            fullWidth={true}
          />,
          element
        );
        return () => ReactDOM.unmountComponentAtNode(element);
      },
    });
  }
}
