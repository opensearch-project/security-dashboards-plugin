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

import { ALL_ACCESS_ROLE, SHORTEN_URL_DATA } from '../../support/constants';

import samlUserRoleMapping from '../../fixtures/saml/samlUserRoleMappiing.json';

const basePath = Cypress.env('basePath') || '';

before(() => {
  cy.intercept('https://localhost:9200');

  // Avoid Cypress lock onto the ipv4 range, so fake `visit()` before `request()`.
  // See: https://github.com/cypress-io/cypress/issues/25397#issuecomment-1402556488
  if (Cypress.env('loginMethod') === 'saml_multiauth') {
    cy.visit(`http://localhost:5601${basePath}`);
  } else {
    cy.origin('http://[::1]:7000', { args: { basePath } }, ({ basePath }) => {
      cy.visit(`http://localhost:5601${basePath}`);
    });
  }

  cy.createRoleMapping(ALL_ACCESS_ROLE, samlUserRoleMapping);
  cy.clearCookies();
  cy.clearLocalStorage();
});

afterEach(() => {
  cy.clearCookies();
  cy.clearLocalStorage();
});

describe('Log in via SAML', () => {
  const samlLogin = () => {
    if (Cypress.env('loginMethod') === 'saml_multiauth') {
      cy.loginWithSamlMultiauth();
    } else {
      cy.loginWithSaml();
    }
  };

  it('Login to app/opensearch_dashboards_overview#/ when SAML is enabled', () => {
    localStorage.setItem('opendistro::security::tenant::saved', '"__user__"');
    localStorage.setItem('home:newThemeModal:show', 'false');

    cy.visit(`http://localhost:5601${basePath}/app/opensearch_dashboards_overview`, {
      failOnStatusCode: false,
    });

    samlLogin();

    cy.get('#osdOverviewPageHeader__title').should('be.visible');
    cy.getCookie('security_authentication').should('exist');
  });

  it('Login to app/dev_tools#/console when SAML is enabled', () => {
    localStorage.setItem('opendistro::security::tenant::saved', '"__user__"');
    localStorage.setItem('home:newThemeModal:show', 'false');

    cy.visit(`http://localhost:5601${basePath}/app/dev_tools#/console`, {
      failOnStatusCode: false,
    });

    samlLogin();

    cy.get('a.euiBreadcrumb--last').contains('Dev Tools');
    cy.getCookie('security_authentication').should('exist');
  });

  it('Login to Dashboard with Hash', () => {
    localStorage.setItem('opendistro::security::tenant::saved', '"__user__"');
    localStorage.setItem('home:newThemeModal:show', 'false');

    const urlWithHash = `http://localhost:5601${basePath}/app/security-dashboards-plugin#/getstarted`;

    cy.visit(urlWithHash, {
      failOnStatusCode: false,
    });

    samlLogin();

    cy.get('h1').contains('Get started');
    cy.getCookie('security_authentication').should('exist');
  });

  it('Tenancy persisted after logout in SAML', () => {
    localStorage.setItem('home:newThemeModal:show', 'false');

    cy.visit(`http://localhost:5601${basePath}/app/opensearch_dashboards_overview`, {
      failOnStatusCode: false,
    });

    samlLogin();

    cy.get('#private').should('be.enabled');
    cy.get('#private').click({ force: true });

    cy.get('button[data-test-subj="confirm"]').click();

    cy.get('#osdOverviewPageHeader__title').should('be.visible');

    cy.get('button[id="user-icon-btn"]').click();

    cy.get('button[data-test-subj^="log-out-"]').click();

    samlLogin();

    cy.get('#user-icon-btn').should('be.visible');
    cy.get('#user-icon-btn').click();

    cy.get('#osdOverviewPageHeader__title').should('be.visible');

    cy.get('#tenantName').should('have.text', 'Private');
  });

  it('Login to Dashboard with Goto URL', () => {
    localStorage.setItem('home:newThemeModal:show', 'false');
    cy.shortenUrl(SHORTEN_URL_DATA, 'global').then((response) => {
      // We need to explicitly clear cookies,
      // since the Shorten URL api is return's set-cookie header for admin user.
      cy.clearCookies().then(() => {
        const gotoUrl = `http://localhost:5601${basePath}/goto/${response.urlId}?security_tenant=global`;
        cy.visit(gotoUrl);
        samlLogin();
        cy.getCookie('security_authentication').should('exist');
      });
    });
  });
});
