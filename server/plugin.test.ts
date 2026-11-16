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

  const startPlugin = async (
    getTenantInfoWithInternalUser: jest.Mock,
    putIndexTemplate?: jest.Mock
  ) => {
    const initializerContext = coreMock.createPluginInitializerContext({
      multitenancy: { enabled: true },
    });
    const plugin = new SecurityPlugin(initializerContext);
    // start() reads the client that setup() creates
    Object.assign(plugin, { securityClient: { getTenantInfoWithInternalUser } });
    const coreStart = coreMock.createStart();
    if (putIndexTemplate) {
      coreStart.opensearch.client.asInternalUser.indices.putIndexTemplate = putIndexTemplate;
    }

    await expect(plugin.start(coreStart)).resolves.toBeDefined();
    // start() does not wait for the tenant index setup, so let its promises settle
    await new Promise((resolve) => setImmediate(resolve));

    return initializerContext.logger.get().error as jest.Mock;
  };

  it('continues startup and logs the error once when the tenant info call is rejected', async () => {
    const getTenantInfo = jest.fn().mockRejectedValue(authorizationException);

    const logError = await startPlugin(getTenantInfo);

    expect(getTenantInfo).toHaveBeenCalled();
    expect(logError).toHaveBeenCalledTimes(1);
    expect(logError).toHaveBeenCalledWith(
      `Failed to migrate tenant indices: ${authorizationException.stack}`
    );
  });

  it('continues startup and logs the error once when the index template call is rejected', async () => {
    const error = new Error('Template Exception');
    const putIndexTemplate = jest.fn().mockRejectedValue(error);

    const logError = await startPlugin(jest.fn().mockResolvedValue({}), putIndexTemplate);

    expect(putIndexTemplate).toHaveBeenCalled();
    expect(logError).toHaveBeenCalledTimes(1);
    expect(logError).toHaveBeenCalledWith(
      `Failed to set up the tenant index template: ${error.stack}`
    );
  });
});
