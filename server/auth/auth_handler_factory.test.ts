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
    MultipleAuthentication: jest.fn().mockImplementation(() => {
      return {
        authHandler: () => {},
        type: ['openid', 'saml', 'basiauth'],
        multiple_auth_enabled: false,
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

  test('get basic auth: string array', () => {
    const auth = getAuthenticationHandler(
      ['basicauth'],
      router,
      config,
      core,
      esClient,
      sessionStorageFactory,
      logger
    );
    expect(auth.type).toEqual('basicauth');
  });

  test('get basic auth: string', () => {
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

  test('get basic auth with empty auth type: string array', () => {
    const auth = getAuthenticationHandler(
      [''],
      router,
      config,
      core,
      esClient,
      sessionStorageFactory,
      logger
    );
    expect(auth.type).toEqual('basicauth');
  });

  test('get basic auth with empty auth type: string', () => {
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

  test('get jwt auth: string array', () => {
    const auth = getAuthenticationHandler(
      ['jwt'],
      router,
      config,
      core,
      esClient,
      sessionStorageFactory,
      logger
    );
    expect(auth.type).toEqual('jwt');
  });

  test('get jwt auth: string', () => {
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

  test('get openid auth: string', () => {
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

  test('get openid auth: string array', () => {
    const auth = getAuthenticationHandler(
      ['openid'],
      router,
      config,
      core,
      esClient,
      sessionStorageFactory,
      logger
    );
    expect(auth.type).toEqual('openid');
  });

  test('get proxy auth: string array', () => {
    const auth = getAuthenticationHandler(
      ['proxy'],
      router,
      config,
      core,
      esClient,
      sessionStorageFactory,
      logger
    );
    expect(auth.type).toEqual('proxy');
  });

  test('get proxy auth: string', () => {
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

  test('get saml auth: string array', () => {
    const auth = getAuthenticationHandler(
      ['saml'],
      router,
      config,
      core,
      esClient,
      sessionStorageFactory,
      logger
    );
    expect(auth.type).toEqual('saml');
  });

  test('get saml auth: string', () => {
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

  test('multiple_auth_enabled is on, get multi auth', () => {
    config = {
      auth: {
        multiple_auth_enabled: true,
      },
    };
    const auth = getAuthenticationHandler(
      ['openid', 'saml', 'basiauth'],
      router,
      config,
      core,
      esClient,
      sessionStorageFactory,
      logger
    );
    expect(auth.type).toEqual(['openid', 'saml', 'basiauth']);
  });

  test('multiple_auth_enabled is off, get multi auth', () => {
    config = {
      auth: {
        multiple_auth_enabled: false,
      },
    };
    expect(() => {
      getAuthenticationHandler(
        ['openid', 'saml', 'basiauth'],
        router,
        config,
        core,
        esClient,
        sessionStorageFactory,
        logger
      );
    }).toThrow(
      'Multiple Authnetication Mode is disabled. To enable this feature, please set up opensearch_security.auth.multiple_auth_enabled: true'
    );
  });

  test('throws error for invalid auth type: string array', () => {
    expect(() => {
      getAuthenticationHandler(
        ['invalid'],
        router,
        config,
        core,
        esClient,
        sessionStorageFactory,
        logger
      );
    }).toThrow('Unsupported authentication type: invalid');
  });

  test('throws error for invalid auth type: string', () => {
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
