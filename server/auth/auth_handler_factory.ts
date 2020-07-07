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

import { IRouter, CoreSetup, IClusterClient, Logger, SessionStorageFactory } from 'kibana/server';
import { AuthType } from '../../common';
import { OpenIdAuthentication } from './types/openid/openid_auth';
import { SecuritySessionCookie } from '../session/security_cookie';
import { BasicAuthentication } from './types/basic/basic_auth';
import { IAuthenticationType } from './types/authentication_type';
import { SamlAuthentication } from './types/saml/saml_auth';
import { ProxyAuthentication } from './types/proxy/proxy_auth';
import { JwtAuthentication } from './types/jwt/jwt_auth';
import { SecurityPluginConfigType } from '..';

export function getAuthenticationHandler(
  authType: string,
  router: IRouter,
  config: SecurityPluginConfigType,
  core: CoreSetup,
  esClient: IClusterClient,
  securitySessionStorageFactory: SessionStorageFactory<SecuritySessionCookie>,
  logger: Logger
): IAuthenticationType {
  let auth: IAuthenticationType;
  switch (authType) {
    case '':
    case 'basicauth':
      auth = new BasicAuthentication(
        config,
        securitySessionStorageFactory,
        router,
        esClient,
        core,
        logger
      );
      break;
    case AuthType.JWT:
      auth = new JwtAuthentication(config, securitySessionStorageFactory, router, esClient, core);
      break;
    case AuthType.OPEN_ID:
      auth = new OpenIdAuthentication(
        config,
        securitySessionStorageFactory,
        router,
        esClient,
        core,
        logger
      );
      break;
    case AuthType.SAML:
      auth = new SamlAuthentication(
        config,
        securitySessionStorageFactory,
        router,
        esClient,
        core,
        logger
      );
      break;
    case AuthType.PROXY:
      auth = new ProxyAuthentication(config, securitySessionStorageFactory, router, esClient, core);
      break;
    default:
      throw new Error(`Unsupported authentication type: ${authType}`);
  }
  return auth;
}
