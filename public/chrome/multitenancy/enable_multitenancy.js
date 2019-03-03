/*
 * Copyright 2015-2018 _floragunn_ GmbH
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */
/*
 * Portions Copyright 2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License").
 * You may not use this file except in compliance with the License.
 * A copy of the License is located at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * or in the "license" file accompanying this file. This file is distributed
 * on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either
 * express or implied. See the License for the specific language governing
 * permissions and limitations under the License.
 */


import chrome from 'ui/chrome';
import { uiModules } from 'ui/modules';
import { FeatureCatalogueRegistryProvider, FeatureCatalogueCategory } from 'ui/registry/feature_catalogue';
import { EuiIcon } from '@elastic/eui';

export function toggleNavLink(Private) {
    var enabled = chrome.getInjected('multitenancy_enabled');
    chrome.getNavLinkById("security-multitenancy").hidden = !enabled;
    if (enabled) {
      FeatureCatalogueRegistryProvider.register(() => {
          return {
              id: 'security-multitenancy',
              title: 'Security Multi Tenancy',
              description: 'Separate searches, visualizations and dashboards by tenants.',
              icon: 'usersRolesApp',
              path: '/app/security-multitenancy',
              showOnHomePage: true,
              category: FeatureCatalogueCategory.DATA
          };
      });
  }

}

uiModules.get('security').run(toggleNavLink);

