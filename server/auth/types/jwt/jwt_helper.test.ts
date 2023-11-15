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
import {JWT_DEFAULT_EXTRA_STORAGE_OPTIONS} from "./jwt_auth";

describe('test jwt auth library', () => {
  const router: IRouter = { post: (body) => {} };
  let core: CoreSetup = {
    http: {
      basePath: {
        serverBasePath: '/'
      }
    }
  };
  let esClient: ILegacyClusterClient;
  let sessionStorageFactory: SessionStorageFactory<SecuritySessionCookie> = {
    asScoped: jest.fn().mockImplementation(() => {
      return {
        server: {
          states: {
            add: jest.fn()
          }
        }
      }
    })
  };
  let logger: Logger;



  function getTestJWTAuthenticationHandlerWithConfig(config: SecurityPluginConfigType) {
    console.log('>>>>> Getting auth handler', esClient, sessionStorageFactory, logger)
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
      cookie: {
        secure: false,
        name: 'test_cookie_name',
        password: 'secret',
        ttl: 60 * 60 * 1000,
        domain: null,
        isSameSite: false,
      },
      jwt: {
        header: 'Authorization',
        url_param: 'authorization',
        extra_storage: {
          cookie_prefix: JWT_DEFAULT_EXTRA_STORAGE_OPTIONS.cookiePrefix,
          additional_cookies: JWT_DEFAULT_EXTRA_STORAGE_OPTIONS.additionalCookies
        }
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
      cookie: {
        secure: false,
        name: 'test_cookie_name',
        password: 'secret',
        ttl: 60 * 60 * 1000,
        domain: null,
        isSameSite: false,
      },
      jwt: {
        header: 'Authorization',
        url_param: 'urlParamName',
        extra_storage: {
          cookie_prefix: JWT_DEFAULT_EXTRA_STORAGE_OPTIONS.cookiePrefix,
          additional_cookies: JWT_DEFAULT_EXTRA_STORAGE_OPTIONS.additionalCookies
        }
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
