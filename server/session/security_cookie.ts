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

import { SessionStorageCookieOptions } from '../../../../src/core/server';
import { SecurityPluginConfigType } from '..';

export interface SecuritySessionCookie {
  // security_authentication
  username?: string;
  credentials?: any;
  authType?: string;
  assignAuthHeader?: boolean;
  isAnonymousAuth?: boolean;
  expiryTime?: number;
  additionalAuthHeaders?: any;

  // security_storage
  tenant?: any;

  // for oidc auth workflow
  oidc?: any;

  // for Saml auth workflow
  saml?: {
    requestId?: string;
    nextUrl?: string;
    redirectHash?: boolean;
  };
}

export function getSecurityCookieOptions(
  config: SecurityPluginConfigType
): SessionStorageCookieOptions<SecuritySessionCookie> {
  return {
    name: config.cookie.name,
    encryptionKey: config.cookie.password,
    validate: (sessionStorage: SecuritySessionCookie | SecuritySessionCookie[]) => {
      sessionStorage = sessionStorage as SecuritySessionCookie;
      if (sessionStorage === undefined) {
        return { isValid: false, path: '/' };
      }

      // TODO: with setting redirect attributes to support OIDC and SAML,
      //       we need to do additonal cookie validatin in AuthenticationHandlers.
      // if SAML fields present
      if (sessionStorage.saml && sessionStorage.saml.requestId && sessionStorage.saml.nextUrl) {
        return { isValid: true, path: '/' };
      }

      // if OIDC fields present
      if (sessionStorage.oidc) {
        return { isValid: true, path: '/' };
      }

      if (sessionStorage.expiryTime === undefined || sessionStorage.expiryTime < Date.now()) {
        return { isValid: false, path: '/' };
      }
      return { isValid: true, path: '/' };
    },
    isSecure: config.cookie.secure,
    sameSite: config.cookie.isSameSite || undefined,
  };
}

export function clearOldVersionCookieValue(config: SecurityPluginConfigType): string {
  if (config.cookie.secure) {
    return 'security_authentication=; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Secure; HttpOnly; Path=/';
  } else {
    return 'security_authentication=; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; Path=/';
  }
}
