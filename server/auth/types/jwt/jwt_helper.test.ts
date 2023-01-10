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

import { getAuthenticationHandler } from '../../auth_handler_factory';

describe('test jwt auth library', () => {
  const router: IRouter = { post: (body) => {} };
  let core: CoreSetup;
  let esClient: ILegacyClusterClient;
  let sessionStorageFactory: SessionStorageFactory<SecuritySessionCookie>;
  let logger: Logger;

  function getTestJWTAuthenticationHandlerWithConfig(config: SecurityPluginConfigType) {
    return getAuthenticationHandler(
      'jwt',
      router,
      config,
      core,
      esClient,
      sessionStorageFactory,
      logger
    );
  }

  test('test getTokenFromUrlParam', async () => {
    const config = {
      jwt: {
        header: 'Authorization',
        url_param: 'authorization',
      },
    };
    const auth = await getTestJWTAuthenticationHandlerWithConfig(config);

    const url = new URL('http://localhost:5601/app/api/v1/auth/authinfo?authorization=testtoken');
    const request = {
      url,
    };

    const expectedToken = 'testtoken';
    const token = auth.getTokenFromUrlParam(request);
    expect(token).toEqual(expectedToken);
  });

  test('test getTokenFromUrlParam incorrect url_param', async () => {
    const config = {
      jwt: {
        header: 'Authorization',
        url_param: 'urlParamName',
      },
    };
    const auth = await getTestJWTAuthenticationHandlerWithConfig(config);

    const url = new URL('http://localhost:5601/app/api/v1/auth/authinfo?authorization=testtoken');
    const request = {
      url,
    };

    const expectedToken = undefined;
    const token = auth.getTokenFromUrlParam(request);
    expect(token).toEqual(expectedToken);
  });
});
