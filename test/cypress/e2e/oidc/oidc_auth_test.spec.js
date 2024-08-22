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

const basePath = Cypress.env('basePath') || '';

describe('Log in via OIDC', () => {
  afterEach(() => {
    cy.clearCookies();
    cy.clearLocalStorage();
  });

  const kcLogin = () => {
    cy.origin('http://127.0.0.1:8080', () => {
      const login = 'admin';
      const password = 'admin';

      cy.get('#kc-page-title').should('be.visible');
      cy.get('input[id=username]').should('be.visible').type(login);
      cy.get('input[id=password]').should('be.visible').type(password);
      cy.get('#kc-login').click();
    });
  };

  it('Login to app/opensearch_dashboards_overview#/ when OIDC is enabled', () => {
    cy.visit(`http://localhost:5601${basePath}/app/opensearch_dashboards_overview`, {
      failOnStatusCode: false,
    });

    kcLogin();

    localStorage.setItem('opendistro::security::tenant::saved', '""');
    localStorage.setItem('home:newThemeModal:show', 'false');

    cy.get('#osdOverviewPageHeader__title').should('be.visible');

    cy.getCookie('security_authentication').should('exist');
  });

  it('Login to app/dev_tools#/console when OIDC is enabled', () => {
    cy.visit(`http://localhost:5601${basePath}/app/dev_tools#/console`, {
      failOnStatusCode: false,
    });

    kcLogin();

    cy.getCookie('security_authentication').should('exist');

    localStorage.setItem('opendistro::security::tenant::saved', '""');
    localStorage.setItem('home:newThemeModal:show', 'false');

    cy.get('a[data-test-subj="breadcrumb first last"]').contains('Dev Tools').should('be.visible');
  });

  it('Login to Dashboard with Hash', () => {
    const urlWithHash = `http://localhost:5601${basePath}/app/security-dashboards-plugin#/getstarted`;

    cy.visit(urlWithHash, {
      failOnStatusCode: false,
    });

    kcLogin();
    cy.getCookie('security_authentication').should('exist');
    cy.getCookie('security_authentication_oidc1').should('exist');

    cy.url().then((url) => {
      cy.visit(url, {
        failOnStatusCode: false,
      });
    });

    localStorage.setItem('opendistro::security::tenant::saved', '""');
    localStorage.setItem('home:newThemeModal:show', 'false');

    cy.get('h1.euiText--small').contains('Get started');
  });

  it('Tenancy persisted after logout in OIDC', () => {
    cy.visit(`http://localhost:5601${basePath}/app/opensearch_dashboards_overview#/`, {
      failOnStatusCode: false,
    });

    kcLogin();

    cy.url().then((url) => {
      cy.visit(url, {
        failOnStatusCode: false,
      });
    });

    localStorage.setItem('home:newThemeModal:show', 'false');

    cy.get('#private').should('be.enabled');
    cy.get('#private').click({ force: true });

    cy.get('button[data-test-subj="confirm"]').click();

    cy.get('#osdOverviewPageHeader__title').should('be.visible');

    cy.get('button[id="user-icon-btn"]').click();

    cy.intercept('GET', `${basePath}/auth/openid/logout`).as('openidLogout');

    cy.get('button[data-test-subj^="log-out-"]').click();

    cy.wait('@openidLogout').then(() => {});

    kcLogin();

    cy.get('#user-icon-btn').should('be.visible');
    cy.get('#user-icon-btn').click();

    cy.get('#osdOverviewPageHeader__title').should('be.visible');

    cy.get('#tenantName').should('have.text', 'Private');
  });
});
