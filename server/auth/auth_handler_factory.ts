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
} from 'opensearch-dashboards/server';
import { AuthType } from '../../common';
import {
  BasicAuthentication,
  JwtAuthentication,
  OpenIdAuthentication,
  ProxyAuthentication,
  SamlAuthentication,
  MultipleAuthentication,
  KerberosAuthentication,
} from './types';
import { SecuritySessionCookie } from '../session/security_cookie';
import { IAuthenticationType, IAuthHandlerConstructor } from './types/authentication_type';
import { SecurityPluginConfigType } from '..';

async function createAuthentication(
  ctor: IAuthHandlerConstructor,
  config: SecurityPluginConfigType,
  sessionStorageFactory: SessionStorageFactory<SecuritySessionCookie>,
  router: IRouter,
  esClient: ILegacyClusterClient,
  coreSetup: CoreSetup,
  logger: Logger
): Promise<IAuthenticationType> {
  const authHandler = new ctor(config, sessionStorageFactory, router, esClient, coreSetup, logger);
  await authHandler.init();
  return authHandler;
}

export async function getAuthenticationHandler(
  authType: string | string[],
  router: IRouter,
  config: SecurityPluginConfigType,
  core: CoreSetup,
  esClient: ILegacyClusterClient,
  securitySessionStorageFactory: SessionStorageFactory<SecuritySessionCookie>,
  logger: Logger
): Promise<IAuthenticationType> {
  let authHandlerType: IAuthHandlerConstructor;
  if (typeof authType === 'string' || authType.length === 1) {
    const currType = typeof authType === 'string' ? authType : authType[0];
    switch (currType.toLowerCase()) {
      case '':
      case AuthType.BASIC:
        authHandlerType = BasicAuthentication;
        break;
      case AuthType.JWT:
        authHandlerType = JwtAuthentication;
        break;
      case AuthType.OPEN_ID:
        authHandlerType = OpenIdAuthentication;
        break;
      case AuthType.SAML:
        authHandlerType = SamlAuthentication;
        break;
      case AuthType.PROXY:
        authHandlerType = ProxyAuthentication;
        break;
      case AuthType.KERBEROS:
        authHandlerType = KerberosAuthentication;
        break;
      default:
        throw new Error(`Unsupported authentication type: ${currType}`);
    }
  } else {
    if (config.auth.multiple_auth_enabled) {
      authHandlerType = MultipleAuthentication;
    } else {
      throw new Error(
        `Multiple Authentication Mode is disabled. To enable this feature, please set up opensearch_security.auth.multiple_auth_enabled: true`
      );
    }
  }
  const auth: IAuthenticationType = await createAuthentication(
    authHandlerType,
    config,
    securitySessionStorageFactory,
    router,
    esClient,
    core,
    logger
  );
  return auth;
}
