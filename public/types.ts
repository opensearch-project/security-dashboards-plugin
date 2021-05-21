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

import { NavigationPublicPluginStart } from '../../../src/plugins/navigation/public';

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface SecurityPluginSetup {}
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface SecurityPluginStart {}

export interface AppPluginStartDependencies {
  navigation: NavigationPublicPluginStart;
}

export interface AuthInfo {
  user_name: string;
  tenants: {
    [tenant: string]: boolean;
  };
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
    autologout: boolean;
    backend_configurable: boolean;
  };
  multitenancy: {
    enabled: boolean;
    tenants: {
      enable_private: boolean;
      enable_global: boolean;
    };
  };
  auth: {
    type: string;
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
