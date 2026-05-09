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
const keycloakOrigin = 'http://127.0.0.1:8080';

describe('Log in via OIDC', () => {
  afterEach(() => {
    cy.clearCookies();
    cy.clearLocalStorage();
  });

  const kcLogin = () => {
    cy.origin(keycloakOrigin, () => {
      const login = 'admin';
      const password = 'admin';

      cy.get('#kc-page-title').should('be.visible');
      cy.get('input[id=username]').should('be.visible').type(login);
      cy.get('input[id=password]').should('be.visible').type(password);
      cy.get('#kc-login').click();
    });
  };

  const loginWithOidc = (url) => {
    const oidcLoginUrl = new URL(`http://localhost:5601${basePath}/auth/openid/login`);
    const targetUrl = new URL(url);

    oidcLoginUrl.searchParams.set('redirectHash', 'false');
    oidcLoginUrl.searchParams.set('nextUrl', `${targetUrl.pathname}${targetUrl.search}`);

    cy.visit(oidcLoginUrl.toString(), {
      failOnStatusCode: false,
    });

    kcLogin();

    cy.location('origin', { timeout: 60000 }).should('not.eq', keycloakOrigin);
    cy.visit(url, {
      failOnStatusCode: false,
    });
  };

  it('Login to app/opensearch_dashboards_overview#/ when OIDC is enabled', () => {
    loginWithOidc(`http://localhost:5601${basePath}/app/opensearch_dashboards_overview`);

    localStorage.setItem('opendistro::security::tenant::saved', '""');
    localStorage.setItem('home:newThemeModal:show', 'false');

    cy.get('#osdOverviewPageHeader__title').should('be.visible');

    cy.getCookie('security_authentication').should('exist');
  });

  it('Login to app/dev_tools#/console when OIDC is enabled', () => {
    loginWithOidc(`http://localhost:5601${basePath}/app/dev_tools#/console`);

    cy.getCookie('security_authentication').should('exist');

    localStorage.setItem('opendistro::security::tenant::saved', '""');
    localStorage.setItem('home:newThemeModal:show', 'false');

    cy.get('a[data-test-subj="breadcrumb first last"]').contains('Dev Tools').should('be.visible');
  });

  it('Login to Dashboard with Hash', () => {
    const urlWithHash = `http://localhost:5601${basePath}/app/security-dashboards-plugin#/getstarted`;

    loginWithOidc(urlWithHash);
    cy.getCookie('security_authentication').should('exist');
    cy.getCookie('security_authentication_oidc1').should('exist');

    localStorage.setItem('opendistro::security::tenant::saved', '""');
    localStorage.setItem('home:newThemeModal:show', 'false');

    cy.get('h1').contains('Get started');
  });

  it('Login to Dashboard preserving Tenant', () => {
    const startUrl = `http://localhost:5601${basePath}/app/dashboards?security_tenant=private#/list`;

    sessionStorage.setItem('opendistro::security::tenant::show_popup', 'false');

    loginWithOidc(startUrl);
    cy.getCookie('security_authentication').should('exist');

    localStorage.setItem('home:newThemeModal:show', 'false');

    cy.get('#user-icon-btn').should('be.visible');
    cy.get('#user-icon-btn').click();

    cy.get('#tenantName').should('have.text', 'Private');
  });

  it('Tenancy persisted after logout in OIDC', () => {
    const url = `http://localhost:5601${basePath}/app/opensearch_dashboards_overview#/`;
    loginWithOidc(url);

    localStorage.setItem('home:newThemeModal:show', 'false');

    cy.get('#private').should('be.enabled');
    cy.get('#private').click({ force: true });

    cy.get('button[data-test-subj="confirm"]').click();

    cy.get('#osdOverviewPageHeader__title').should('be.visible');

    cy.get('button[id="user-icon-btn"]').click();

    cy.intercept('GET', `${basePath}/auth/openid/logout`).as('openidLogout');

    cy.get('button[data-test-subj^="log-out-"]').click();

    cy.wait('@openidLogout').then(() => {});

    loginWithOidc(url);

    cy.get('#user-icon-btn').should('be.visible');
    cy.get('#user-icon-btn').click();

    cy.get('#osdOverviewPageHeader__title').should('be.visible');

    cy.get('#tenantName').should('have.text', 'Private');
  });
});
