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

import { ALL_ACCESS_ROLE } from '../../support/constants';

import samlUserRoleMapping from '../../fixtures/saml/samlUserRoleMappiing.json'

before(() => {
  cy.intercept('https://localhost:9200');

  // Avoid Cypress lock onto the ipv4 range, so fake `visit()` before `request()`.
  // See: https://github.com/cypress-io/cypress/issues/25397#issuecomment-1402556488
  cy.visit('http://localhost:5601');

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
    cy.get('input[id=userName]').should('be.visible');
    cy.get('button[id=btn-sign-in]').should('be.visible').click();
  };

  it('Login to app/opensearch_dashboards_overview#/ when SAML is enabled', () => {
    localStorage.setItem("opendistro::security::tenant::saved", "\"__user__\"");
    localStorage.setItem("home:newThemeModal:show", "false");

    cy.visit('http://localhost:5601/app/opensearch_dashboards_overview', {
      failOnStatusCode: false,
    });
    
    samlLogin();

    cy.get('#osdOverviewPageHeader__title').should('be.visible');
    cy.getCookie('security_authentication').should('exist');
  });

  it('Login to app/dev_tools#/console when SAML is enabled', () => {
    localStorage.setItem("opendistro::security::tenant::saved", "\"__user__\"");
    localStorage.setItem("home:newThemeModal:show", "false");

    cy.visit('http://localhost:5601/app/dev_tools#/console', {
      failOnStatusCode: false,
    });
    
    samlLogin();

    cy.get('a.euiBreadcrumb--last').contains('Dev Tools');
    cy.getCookie('security_authentication').should('exist');
  });

  it('Login to Dashboard with Hash', () => {
    localStorage.setItem("opendistro::security::tenant::saved", "\"__user__\"");
    localStorage.setItem("home:newThemeModal:show", "false");

    const urlWithHash = `http://localhost:5601/app/security-dashboards-plugin#/getstarted`;

    cy.visit(urlWithHash, {
      failOnStatusCode: false,
    });
    
    samlLogin();

    cy.get('h1.euiTitle--large').contains('Get started');
    cy.getCookie('security_authentication').should('exist');

  });

  it('Tenancy persisted after logout in SAML', () => {
    localStorage.setItem("home:newThemeModal:show", "false");

    cy.visit('http://localhost:5601/app/opensearch_dashboards_overview', {
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
});
