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
      };
    }),
    JwtAuthentication: jest.fn().mockImplementation(() => {
      return {
        authHandler: () => {},
        type: 'jwt',
      };
    }),
    OpenIdAuthentication: jest.fn().mockImplementation(() => {
      return {
        authHandler: () => {},
        type: 'openid',
      };
    }),
    ProxyAuthentication: jest.fn().mockImplementation(() => {
      return {
        authHandler: () => {},
        type: 'proxy',
      };
    }),
    SamlAuthentication: jest.fn().mockImplementation(() => {
      return {
        authHandler: () => {},
        type: 'saml',
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

  test('get basic auth', () => {
    const auth = getAuthenticationHandler(
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

  test('get basic auth with empty auth type', () => {
    const auth = getAuthenticationHandler(
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

  test('get jwt auth', () => {
    const auth = getAuthenticationHandler(
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

  test('get openid auth', () => {
    const auth = getAuthenticationHandler(
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

  test('get proxy auth', () => {
    const auth = getAuthenticationHandler(
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

  test('get saml auth', () => {
    const auth = getAuthenticationHandler(
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

  test('throws error for invalid auth type', () => {
    expect(() => {
      getAuthenticationHandler(
        'invalid',
        router,
        config,
        core,
        esClient,
        sessionStorageFactory,
        logger
      );
    }).toThrow('Unsupported authentication type: invalid');
  });
});
