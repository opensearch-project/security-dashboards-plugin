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
import { merge } from 'lodash';
import { URL } from 'url';
import {
  OpenSearchDashboardsRequest,
  Logger,
  CoreSetup,
  Capabilities,
} from '../../../../src/core/server';
import { SecurityClient } from '../backend/opensearch_security_client';

export class ReadOnlyCapabilitiesSwitcher {
  private readonly logger: Logger;
  private readonlyModeRoles: string[] = ['kibana_read_only']; // default read only role

  constructor(logger: Logger, readonlyModeRoles: string[]) {
    this.logger = logger;
    // Defines the roles for read only mode. Can be done in
    // constructor since this is a static setting in opensearch_dashboards.yml
    this.readonlyModeRoles.push(...readonlyModeRoles);
  }

  public setup(core: CoreSetup, client: SecurityClient) {
    core.capabilities.registerSwitcher(
      // switch UI capabilities dynamically depending on the read_only status
      this.capabilitiesSwitcherHandler(core, client)
    );
  }

  /**
   * Fetches the authinfo of the currently logged in user and
   * checks whether the user had a read-only role or if the
   * currently selected tenant is read-only. If so, all known
   * write controls in Capabilities will be disabled. Dashboards
   * decides when this handler is called. Usually this happens
   * on full page reloads.
   *
   * @param core
   * @param client
   */
  protected capabilitiesSwitcherHandler(core: CoreSetup, client: SecurityClient) {
    return async (request: OpenSearchDashboardsRequest, uiCapabilities: Capabilities) => {
      // for unauthenticated paths we ignore the switcher
      if (this.isAnonymousPage(request)) {
        return uiCapabilities;
      }

      try {
        const authInfo = await client.authinfo(request, request.headers);

        const userHasReadOnlyRole = this.hasReadOnlyRole(authInfo);
        const selectedTenantIsReadOnly = this.isReadOnlyTenant(authInfo);

        // disable write controls for all known apps if the user or
        // selected tenant does not have write privileges
        if (this.shouldDisableWriteControls(authInfo)) {
          this.disableWriteControls(uiCapabilities);
        }
      } catch (error) {
        this.logger.error(`Could not check auth info: ${error.stack}`);
      }

      return uiCapabilities;
    };
  }

  /**
   * Check whether the switcher code should be execute or not.
   * We do not run it for pages which do not require authentication, like login
   * @param request
   * @returns {boolean}
   */
  isAnonymousPage(request: OpenSearchDashboardsRequest) {
    if (request.headers && request.headers.referer) {
      try {
        const fullPath = new URL(request.headers.referer as string).pathname;
        const path = fullPath.split('/').pop() as string;
        const pathsToIgnore = ['login', 'logout', 'customerror'];
        if (pathsToIgnore.indexOf(path) > -1) {
          return true;
        }
      } catch (error) {
        this.logger.error(`Could not parse referer: ${error.stack}`);
      }
    }
    return false;
  }

  shouldDisableWriteControls(authInfo: any): boolean {
    return this.hasReadOnlyRole(authInfo) || this.isReadOnlyTenant(authInfo);
  }

  /**
   * Checks if the user has a security role that is in the list
   * of read-only roles defined in opensearch_dashboards.yml
   * @param authInfo
   * @return boolean
   */
  hasReadOnlyRole(authInfo: any): boolean {
    if (!authInfo || !authInfo.roles) {
      return false;
    }
    const userRoles = authInfo.roles as string[];
    return userRoles.some((role) => this.readonlyModeRoles.includes(role));
  }

  /**
   * Check if currently selected tenant is read only for the user.
   * If so, write controls should be disabled
   * @param authInfo
   * @returns {boolean}
   */
  isReadOnlyTenant(authInfo: any): boolean {
    if (!authInfo || !authInfo.tenants) {
      return false;
    }
    const currentTenant = authInfo.user_requested_tenant || 'global_tenant';
    if (currentTenant === '__user__') {
      // We don't limit the private tenant
      return false;
    }
    // should not happen - the requested tenant is not found
    // in the list of available tenants. Log a warning.
    if (!(currentTenant in authInfo.tenants)) {
      this.logger.warn(
        `Requested tenant ${currentTenant} not found in available tenants ${authInfo.tenants}`
      );
      return false;
    }
    return authInfo.tenants[currentTenant] !== true ? true : false;
  }

  disableWriteControls(capabilities: Capabilities) {
    return merge(capabilities, this.getDefaultReadOnlyCapabilities());
  }

  getDefaultReadOnlyCapabilities(): any {
    return {
      indexPatterns: {
        save: false,
      },
      dev_tools: {
        save: false,
      },
      advancedSettings: {
        save: false,
      },
      dashboard: {
        createNew: false,
        showWriteControls: false,
        saveQuery: false,
      },
      visualize: {
        createShortUrl: false,
        delete: false,
        save: false,
        saveQuery: false,
      },
      discover: {
        createShortUrl: false,
        save: false,
        saveQuery: false,
      },
      savedObjectsManagement: {
        delete: false,
        edit: false,
      },
      management: {
        opensearchDashboards: {
          indexPatterns: false,
        },
      },
    };
  }
}
