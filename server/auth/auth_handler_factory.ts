/*
 *   Copyright 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
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
} from './types';
import { SecuritySessionCookie } from '../session/security_cookie';
import { IAuthenticationType, IAuthHandlerConstructor } from './types/authentication_type';
import { SecurityPluginConfigType } from '..';

function createAuthentication(
  ctor: IAuthHandlerConstructor,
  config: SecurityPluginConfigType,
  sessionStorageFactory: SessionStorageFactory<SecuritySessionCookie>,
  router: IRouter,
  esClient: ILegacyClusterClient,
  coreSetup: CoreSetup,
  logger: Logger
): IAuthenticationType {
  return new ctor(config, sessionStorageFactory, router, esClient, coreSetup, logger);
}

export function getAuthenticationHandler(
  authType: string,
  router: IRouter,
  config: SecurityPluginConfigType,
  core: CoreSetup,
  esClient: ILegacyClusterClient,
  securitySessionStorageFactory: SessionStorageFactory<SecuritySessionCookie>,
  logger: Logger
): IAuthenticationType {
  let authHandlerType: IAuthHandlerConstructor;
  switch (authType) {
    case '':
    case 'basicauth':
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
    default:
      throw new Error(`Unsupported authentication type: ${authType}`);
  }
  const auth: IAuthenticationType = createAuthentication(
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
