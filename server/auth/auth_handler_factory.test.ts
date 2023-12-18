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

import { getAuthenticationHandler } from './auth_handler_factory';
import {
  IRouter,
  CoreSetup,
  ILegacyClusterClient,
  Logger,
  SessionStorageFactory,
} from '../../../../src/core/server';
import { SecurityPluginConfigType } from '..';
import { SecuritySessionCookie } from '../session/security_cookie';

jest.mock('./types', () => {
  return {
    BasicAuthentication: jest.fn().mockImplementation(() => {
      return {
        authHandler: () => {},
        type: 'basicauth',
        init: () => {},
      };
    }),
    JwtAuthentication: jest.fn().mockImplementation(() => {
      return {
        authHandler: () => {},
        type: 'jwt',
        init: () => {},
      };
    }),
    OpenIdAuthentication: jest.fn().mockImplementation(() => {
      return {
        authHandler: () => {},
        type: 'openid',
        init: () => {},
      };
    }),
    ProxyAuthentication: jest.fn().mockImplementation(() => {
      return {
        authHandler: () => {},
        type: 'proxy',
        init: () => {},
      };
    }),
    SamlAuthentication: jest.fn().mockImplementation(() => {
      return {
        authHandler: () => {},
        type: 'saml',
        init: () => {},
      };
    }),
  };
});

describe('test authentication factory', () => {
  let router: IRouter;
  let config: SecurityPluginConfigType;
  let core: CoreSetup;
  let esClient: ILegacyClusterClient;
  let sessionStorageFactory: SessionStorageFactory<SecuritySessionCookie>;
  let logger: Logger;

  beforeEach(() => {});

  test('get basic auth', async () => {
    const auth = await getAuthenticationHandler(
      'basicauth',
      router,
      config,
      core,
      esClient,
      sessionStorageFactory,
      logger
    );
    expect(auth.type).toEqual('basicauth');
  });

  test('get basic auth with empty auth type', async () => {
    const auth = await getAuthenticationHandler(
      '',
      router,
      config,
      core,
      esClient,
      sessionStorageFactory,
      logger
    );
    expect(auth.type).toEqual('basicauth');
  });

  test('get jwt auth', async () => {
    const auth = await getAuthenticationHandler(
      'jwt',
      router,
      config,
      core,
      esClient,
      sessionStorageFactory,
      logger
    );
    expect(auth.type).toEqual('jwt');
  });

  test('get openid auth', async () => {
    const auth = await getAuthenticationHandler(
      'openid',
      router,
      config,
      core,
      esClient,
      sessionStorageFactory,
      logger
    );
    expect(auth.type).toEqual('openid');
  });

  test('get proxy auth', async () => {
    const auth = await getAuthenticationHandler(
      'proxy',
      router,
      config,
      core,
      esClient,
      sessionStorageFactory,
      logger
    );
    expect(auth.type).toEqual('proxy');
  });

  test('get saml auth', async () => {
    const auth = await getAuthenticationHandler(
      'saml',
      router,
      config,
      core,
      esClient,
      sessionStorageFactory,
      logger
    );
    expect(auth.type).toEqual('saml');
  });

  test('throws error for invalid auth type', async () => {
    try {
      await getAuthenticationHandler(
        'invalid',
        router,
        config,
        core,
        esClient,
        sessionStorageFactory,
        logger
      );
    } catch (e) {
      const targetError = 'Error: Unsupported authentication type: invalid';
      expect(e.toString()).toEqual(targetError);
    }
  });
});
