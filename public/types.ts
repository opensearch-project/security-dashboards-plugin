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

import { NavigationPublicPluginStart } from '../../../src/plugins/navigation/public';
import {
  SavedObjectsManagementPluginSetup,
  SavedObjectsManagementPluginStart,
} from '../../../src/plugins/saved_objects_management/public';

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface SecurityPluginSetup {}
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface SecurityPluginStart {}

export interface SecurityPluginSetupDependencies {
  savedObjectsManagement: SavedObjectsManagementPluginSetup;
}

export interface SecurityPluginStartDependencies {
  navigation: NavigationPublicPluginStart;
  savedObjectsManagement: SavedObjectsManagementPluginStart;
}

export interface AuthInfo {
  user_name: string;
  tenants: {
    [tenant: string]: boolean;
  };
}

export interface DashboardsInfo {
  multitenancy_enabled?: boolean;
  private_tenant_enabled?: boolean;
  default_tenant: string;
}

export interface ClientConfigType {
  readonly_mode: {
    roles: string[];
  };
  ui: {
    basicauth: {
      login: {
        title: string;
        subtitle: string;
        showbrandimage: boolean;
        brandimage: string;
        buttonstyle: string;
      };
    };
    anonymous: {
      login: {
        buttonname: string;
        showbrandimage: boolean;
        brandimage: string;
        buttonstyle: string;
      };
    };
    openid: {
      login: {
        buttonname: string;
        showbrandimage: boolean;
        brandimage: string;
        buttonstyle: string;
      };
    };
    saml: {
      login: {
        buttonname: string;
        showbrandimage: boolean;
        brandimage: string;
        buttonstyle: string;
      };
    };
    autologout: boolean;
    backend_configurable: boolean;
  };
  multitenancy: {
    enable_aggregation_view: boolean;
    enabled: boolean;
    tenants: {
      enable_private: boolean;
      enable_global: boolean;
    };
  };
  auth: {
    type: string | string[];
    anonymous_auth_enabled: boolean;
    logout_url: string;
  };
  clusterPermissions: {
    include: string[];
  };
  indexPermissions: {
    include: string[];
  };
  disabledTransportCategories: {
    exclude: string[];
  };
  disabledRestCategories: {
    exclude: string[];
  };
}
