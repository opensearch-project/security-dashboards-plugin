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

import { SEC_API, ADMIN_AUTH, DASHBOARDS_API } from './constants';

/**
 * Overwrite request command to support authentication similar to visit.
 * The request function parameters can be url, or (method, url), or (method, url, body).
 */
Cypress.Commands.overwrite('request', (originalFn, ...args) => {
  const defaults = {};
  defaults.auth = ADMIN_AUTH;
  let options = {};
  if (typeof args[0] === 'object' && args[0] !== null) {
    options = { ...args[0] };
  } else if (args.length === 1) {
    [options.url] = args;
  } else if (args.length === 2) {
    [options.method, options.url] = args;
  } else if (args.length === 3) {
    [options.method, options.url, options.body] = args;
  }

  return originalFn({ ...defaults, ...options });
});

Cypress.Commands.add('createTenant', (tenantID, tenantJson) => {
  cy.request(
    'PUT',
    `${Cypress.env('openSearchUrl')}${SEC_API.TENANTS_BASE}/${tenantID}`,
    tenantJson
  ).then((response) => {
    expect(response.status).to.eq(200);
  });
});

Cypress.Commands.add('createInternalUser', (userID, userJson) => {
  cy.request(
    'PUT',
    `${Cypress.env('openSearchUrl')}${SEC_API.INTERNALUSERS_BASE}/${userID}`,
    userJson
  ).then((response) => {
    expect(response.status).to.eq(200);
  });
});

Cypress.Commands.add('createRole', (roleID, roleJson) => {
  cy.request('PUT', `${Cypress.env('openSearchUrl')}${SEC_API.ROLE_BASE}/${roleID}`, roleJson).then(
    (response) => {
      expect(response.status).to.eq(200);
    }
  );
});

Cypress.Commands.add('createRoleMapping', (roleID, rolemappingJson) => {
  cy.request(
    'PUT',
    `${Cypress.env('openSearchUrl')}${SEC_API.ROLE_MAPPING_BASE}/${roleID}`,
    rolemappingJson
  ).then((response) => {
    expect(response.status).to.eq(200);
  });
});

Cypress.Commands.add('loginWithSaml', () => {
  cy.get('input[id=userName]').should('be.visible');
  cy.get('button[id=btn-sign-in]').should('be.visible').click();
});

Cypress.Commands.add('loginWithSamlMultiauth', () => {
  cy.get('a[aria-label="saml_login_button"]').should('be.visible');
  cy.get('a[aria-label="saml_login_button"]').should('be.visible').click();
  cy.get('input[id=userName]').should('be.visible');
  cy.get('button[id=btn-sign-in]').should('be.visible').click();
});

Cypress.Commands.add('shortenUrl', (data, tenant) => {
  cy.request({
    url: `http://localhost:5601${DASHBOARDS_API.SHORTEN_URL}`,
    method: 'POST',
    body: data,
    headers: { securitytenant: tenant, 'osd-xsrf': 'osd-fetch' },
  }).then((response) => {
    expect(response.status).to.eq(200);
    return response.body;
  });
});
