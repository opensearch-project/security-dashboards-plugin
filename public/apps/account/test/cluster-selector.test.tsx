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

import { SecurityPluginSetupDependencies, SecurityPluginStartDependencies } from '../../../types';
import { setupClusterSelector } from '../cluster-selector';

describe('Cluster selector', () => {
  const registerRightMock = jest.fn();
  const mockCoreStart = {
    chrome: {
      navControls: {
        registerRight: registerRightMock,
      },
    },
  };

  const mockDepsDataSourceEnabled = {
    dataSource: {
      dataSourceEnabled: true,
    },
  } as SecurityPluginStartDependencies;

  const mockDepsDataSourceDisabled = {
    dataSource: {
      dataSourceEnabled: false,
    },
  } as SecurityPluginStartDependencies;

  it('Should not register cluster selector if multi data source is not enabled', (done) => {
    setupClusterSelector(mockCoreStart, mockDepsDataSourceDisabled);

    process.nextTick(() => {
      expect(registerRightMock).not.toBeCalled();
      done();
    });
  });

  it('Should register cluster selector if multi data source is enabled', (done) => {
    setupClusterSelector(mockCoreStart, mockDepsDataSourceEnabled);

    process.nextTick(() => {
      expect(registerRightMock).toHaveBeenCalledTimes(1);
      done();
    });
  });
});
