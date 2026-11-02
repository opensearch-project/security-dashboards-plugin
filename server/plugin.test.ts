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

import { coreMock } from '../../../src/core/server/mocks';
import { SecurityPlugin } from './plugin';

describe('SecurityPlugin start', () => {
  const authorizationException = Object.assign(new Error('Authorization Exception'), {
    statusCode: 403,
    path: '/_plugins/_security/tenantinfo',
  });

  it('continues startup and logs the error when the tenant info call is rejected', async () => {
    const initializerContext = coreMock.createPluginInitializerContext({
      multitenancy: { enabled: true },
    });
    const plugin = new SecurityPlugin(initializerContext);
    const securityClient = {
      getTenantInfoWithInternalUser: jest.fn().mockRejectedValue(authorizationException),
    };
    // start() reads the client that setup() creates
    Object.assign(plugin, { securityClient });

    await expect(plugin.start(coreMock.createStart())).resolves.toBeDefined();
    // start() does not wait for the migration; Jest fails the test if it rejects unhandled
    await new Promise((resolve) => setImmediate(resolve));

    expect(securityClient.getTenantInfoWithInternalUser).toHaveBeenCalled();
    expect(initializerContext.logger.get().error).toHaveBeenCalledWith(
      `Failed to migrate tenant indices: ${authorizationException}`
    );
  });
});
