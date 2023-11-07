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

import {
  IRouter,
  CoreSetup,
  ILegacyClusterClient,
  Logger,
  SessionStorageFactory,
} from '../../../../src/core/server';
import { SecurityPluginConfigType } from '..';
import { SecuritySessionCookie } from '../session/security_cookie';
import { getAuthenticationHandler } from './auth_handler_factory';
import { AuthType } from '../../common';

const mockBasicAuthType = AuthType.BASIC;
const mockSAMLAuthType = AuthType.SAML;

jest.mock('./types', () => {
  return {
    BasicAuthentication: jest.fn().mockImplementation(() => {
      return {
        authHandler: () => {},
        type: mockBasicAuthType,
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
        type: mockSAMLAuthType,
        init: () => {},
      };
    }),
    MultipleAuthentication: jest.fn().mockImplementation(() => {
      return {
        authHandler: () => {},
        type: ['openid', mockSAMLAuthType, mockBasicAuthType],
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

  test('get basic auth: string array', async () => {
    const auth = await getAuthenticationHandler(
      [AuthType.BASIC],
      router,
      config,
      core,
      esClient,
      sessionStorageFactory,
      logger
    );
    expect(auth.type).toEqual(AuthType.BASIC);
  });

  test('get basic auth: string', async () => {
    const auth = await getAuthenticationHandler(
      AuthType.BASIC,
      router,
      config,
      core,
      esClient,
      sessionStorageFactory,
      logger
    );
    expect(auth.type).toEqual(AuthType.BASIC);
  });

  test('get basic auth with empty auth type: string', async () => {
    const auth = await getAuthenticationHandler(
      '',
      router,
      config,
      core,
      esClient,
      sessionStorageFactory,
      logger
    );
    expect(auth.type).toEqual(AuthType.BASIC);
  });

  test('get basic auth with empty auth type: string array', async () => {
    const auth = await getAuthenticationHandler(
      [''],
      router,
      config,
      core,
      esClient,
      sessionStorageFactory,
      logger
    );
    expect(auth.type).toEqual(AuthType.BASIC);
  });

  test('get jwt auth: string array', async () => {
    const auth = await getAuthenticationHandler(
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

  test('get jwt auth: string', async () => {
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

  test('get openid auth: string', async () => {
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

  test('get openid auth: string array', async () => {
    const auth = await getAuthenticationHandler(
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

  test('get proxy auth: string array', async () => {
    const auth = await getAuthenticationHandler(
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

  test('get proxy auth: string', async () => {
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

  test('get saml auth: string array', async () => {
    const auth = await getAuthenticationHandler(
      [AuthType.SAML],
      router,
      config,
      core,
      esClient,
      sessionStorageFactory,
      logger
    );
    expect(auth.type).toEqual(AuthType.SAML);
  });

  test('get saml auth: string', async () => {
    const auth = await getAuthenticationHandler(
      AuthType.SAML,
      router,
      config,
      core,
      esClient,
      sessionStorageFactory,
      logger
    );
    expect(auth.type).toEqual(AuthType.SAML);
  });

  test('multiple_auth_enabled is on, get multi auth', async () => {
    config = {
      auth: {
        multiple_auth_enabled: true,
      },
    };
    const auth = await getAuthenticationHandler(
      ['openid', AuthType.SAML, AuthType.BASIC],
      router,
      config,
      core,
      esClient,
      sessionStorageFactory,
      logger
    );
    expect(auth.type).toEqual(['openid', AuthType.SAML, AuthType.BASIC]);
  });

  test('multiple_auth_enabled is off, get multi auth', async () => {
    config = {
      auth: {
        multiple_auth_enabled: false,
      },
    };
    try {
      await getAuthenticationHandler(
        ['openid', AuthType.SAML, AuthType.BASIC],
        router,
        config,
        core,
        esClient,
        sessionStorageFactory,
        logger
      );
    } catch (e) {
      const targetError =
        'Error: Multiple Authentication Mode is disabled. To enable this feature, please set up opensearch_security.auth.multiple_auth_enabled: true';
      expect(e.toString()).toEqual(targetError);
    }
  });

  test('throws error for invalid auth type: string array', async () => {
    try {
      await getAuthenticationHandler(
        ['invalid'],
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

  test('throws error for invalid auth type: string', async () => {
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
