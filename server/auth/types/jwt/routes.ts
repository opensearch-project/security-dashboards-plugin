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
  Logger,
  SessionStorageFactory
} from 'opensearch-dashboards/server';
import { SecuritySessionCookie } from '../../../session/security_cookie';
import { API_AUTH_LOGOUT, API_PREFIX } from '../../../../common';
import {
  clearSplitCookies,
  ExtraAuthStorageOptions
} from "../../../session/cookie_splitter";
import {JWT_DEFAULT_EXTRA_STORAGE_OPTIONS} from "./jwt_auth";
import {SecurityPluginConfigType} from "../../../index";

export class JwtAuthRoutes {
  constructor(
    private readonly router: IRouter,
    private readonly sessionStorageFactory: SessionStorageFactory<SecuritySessionCookie>,
    private readonly config: SecurityPluginConfigType,
  ) {}

  private getExtraAuthStorageOptions(logger?: Logger): ExtraAuthStorageOptions {
    const extraAuthStorageOptions: ExtraAuthStorageOptions = {
      cookiePrefix:
        this.config.jwt?.extra_storage.cookie_prefix ||
        JWT_DEFAULT_EXTRA_STORAGE_OPTIONS.cookiePrefix,
      additionalCookies:
        this.config.jwt?.extra_storage.additional_cookies ||
        JWT_DEFAULT_EXTRA_STORAGE_OPTIONS.additionalCookies,
      logger: logger,
    };

    return extraAuthStorageOptions;
  }

  public setupRoutes() {
    this.router.post(
      {
        path: `${API_PREFIX}${API_AUTH_LOGOUT}`,
        validate: false,
        options: {
          authRequired: false,
        },
      },
      async (context, request, response) => {
        await clearSplitCookies(
          request,
          this.getExtraAuthStorageOptions()
        );
        this.sessionStorageFactory.asScoped(request).clear();
        return response.ok();
      }
    );
  }
}
