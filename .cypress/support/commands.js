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

/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { SEC_API, ADMIN_AUTH } from "./constants";

/**
 * Overwrite request command to support authentication similar to visit.
 * The request function parameters can be url, or (method, url), or (method, url, body).
 */
Cypress.Commands.overwrite('request', (originalFn, ...args) => {
  let defaults = {};
    defaults.auth = ADMIN_AUTH;
  let options = {};
  if (typeof args[0] === 'object' && args[0] !== null) {
    options = Object.assign({}, args[0]);
  } else if (args.length === 1) {
    [options.url] = args;
  } else if (args.length === 2) {
    [options.method, options.url] = args;
  } else if (args.length === 3) {
    [options.method, options.url, options.body] = args;
  }

  return originalFn(Object.assign({}, defaults, options));
});

Cypress.Commands.add('createTenant', (tenantID, tenantJson) => {
  cy.request(
    'PUT',
    `${Cypress.env('openSearchUrl')}${SEC_API.TENANTS_BASE}/${tenantID}`,
    tenantJson
  );
  cy.wait(10000);
});

Cypress.Commands.add('createInternalUser', (userID, userJson) => {
  cy.request(
    'PUT',
    `${Cypress.env('openSearchUrl')}${SEC_API.INTERNALUSERS_BASE}/${userID}`,
    userJson
  );
  cy.wait(10000);
});

Cypress.Commands.add('createRole', (roleID, roleJson) => {
  cy.request(
    'PUT',
    `${Cypress.env('openSearchUrl')}${SEC_API.ROLE_BASE}/${roleID}`,
    roleJson
  );
  cy.wait(10000);
});

Cypress.Commands.add('createRoleMapping', (roleID, rolemappingJson) => {
  cy.request(
    'PUT',
    `${Cypress.env('openSearchUrl')}${SEC_API.ROLE_MAPPING_BASE}/${roleID}`,
    rolemappingJson
  );
  cy.wait(10000);
});
