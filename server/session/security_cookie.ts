import { SessionStorageCookieOptions, Logger } from "../../../../src/core/server";
import { SecurityPluginConfigType } from "..";

export class SecuritySessionCookie {
  // security_authentication
  username: string;
  credentials?: any;
  authType?: string;
  assignAuthHeader?: boolean;
  isAnonymousAuth?: boolean;
  expiryTime?: number;
  additionalAuthHeaders?: any;

  // security_storage
  tentent?: any;
}

export function getSecurityCookieOptions(config: SecurityPluginConfigType): SessionStorageCookieOptions<SecuritySessionCookie> {
  return {
    name: config.cookie.name,
    encryptionKey: config.cookie.password,
    validate: (sessionStorage: SecuritySessionCookie) => {
      if (sessionStorage === undefined
          || sessionStorage.username === undefined
          || sessionStorage.credentials === undefined) {
        return { isValid: false };
      }

      if (sessionStorage.expiryTime === undefined
          || new Date(sessionStorage.expiryTime) < new Date()) {
        return { isValid: false };
      }
      return { isValid: true, path: '/' };
    },
    isSecure: false, // config.cookie.secure,
  }
}
