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
const osdOrigin = 'http://localhost:5601';

Cypress.on('uncaught:exception', (err) => {
  if (err.message.includes("Cannot read properties of null (reading 'postMessage')")) {
    return false;
  }
});

describe('Log in via OIDC', () => {
  afterEach(() => {
    cy.clearAllCookies();
    cy.clearAllLocalStorage();
  });

  const fillKeycloakLoginForm = () => {
    const login = 'admin';
    const password = 'admin';

    cy.get('#kc-page-title').should('be.visible');
    cy.get('input[id=username]').should('be.visible').type(login);
    cy.get('input[id=password]').should('be.visible').type(password);
    cy.get('#kc-login').click();
  };

  const kcLogin = () => {
    cy.location('origin', { timeout: 60000 }).should('eq', keycloakOrigin);
    fillKeycloakLoginForm();
  };

  const loginWithOidc = (url, options = {}) => {
    const oidcLoginUrl = new URL(`${osdOrigin}${basePath}/auth/openid/login`);
    const targetUrl = new URL(url);

    oidcLoginUrl.searchParams.set('redirectHash', 'false');
    oidcLoginUrl.searchParams.set(
      'nextUrl',
      `${targetUrl.pathname}${targetUrl.search}${targetUrl.hash}`
    );

    cy.visit(oidcLoginUrl.toString(), {
      failOnStatusCode: false,
    });

    kcLogin();

    cy.location('origin', { timeout: 60000 }).should('not.eq', keycloakOrigin);
    cy.origin(osdOrigin, { args: { options } }, ({ options: loginOptions }) => {
      cy.getCookie('security_authentication', { timeout: 60000 }).should('exist');

      if (loginOptions.savedTenant !== undefined) {
        localStorage.setItem('opendistro::security::tenant::saved', loginOptions.savedTenant);
      }

      if (loginOptions.hideHomeModal) {
        localStorage.setItem('home:newThemeModal:show', 'false');
      }

      if (loginOptions.hideTenantPopup) {
        sessionStorage.setItem('opendistro::security::tenant::show_popup', 'false');
      }
    });
    cy.visit(url, {
      failOnStatusCode: false,
    });
  };

  it('Login to app/opensearch_dashboards_overview#/ when OIDC is enabled', () => {
    loginWithOidc(`${osdOrigin}${basePath}/app/opensearch_dashboards_overview`, {
      savedTenant: '""',
      hideHomeModal: true,
    });

    cy.origin(osdOrigin, () => {
      cy.get('#osdOverviewPageHeader__title').should('be.visible');
      cy.getCookie('security_authentication').should('exist');
    });
  });

  it('Login to app/dev_tools#/console when OIDC is enabled', () => {
    loginWithOidc(`${osdOrigin}${basePath}/app/dev_tools#/console`, {
      savedTenant: '""',
      hideHomeModal: true,
    });

    cy.origin(osdOrigin, () => {
      cy.getCookie('security_authentication').should('exist');
      cy.get('a[data-test-subj="breadcrumb first last"]')
        .contains('Dev Tools')
        .should('be.visible');
    });
  });

  it('Login to Dashboard with Hash', () => {
    const urlWithHash = `${osdOrigin}${basePath}/app/security-dashboards-plugin#/getstarted`;

    loginWithOidc(urlWithHash, {
      savedTenant: '""',
      hideHomeModal: true,
    });

    cy.origin(osdOrigin, () => {
      cy.getCookie('security_authentication').should('exist');
      cy.getCookie('security_authentication_oidc1').should('exist');
      cy.get('h1').contains('Get started');
    });
  });

  it('Login to Dashboard preserving Tenant', () => {
    const startUrl = `${osdOrigin}${basePath}/app/dashboards?security_tenant=private#/list`;

    loginWithOidc(startUrl, {
      hideHomeModal: true,
      hideTenantPopup: true,
    });

    cy.origin(osdOrigin, () => {
      cy.get('#user-icon-btn').should('be.visible');
      cy.get('#user-icon-btn').click();
      cy.get('#tenantName').should('have.text', 'Private');
      cy.getCookie('security_authentication').should('exist');
    });
  });

  it('Tenancy persisted after logout in OIDC', () => {
    const url = `${osdOrigin}${basePath}/app/opensearch_dashboards_overview#/`;
    loginWithOidc(url, {
      hideHomeModal: true,
    });

    cy.intercept('GET', `${basePath}/auth/openid/logout`).as('openidLogout');
    cy.origin(osdOrigin, () => {
      localStorage.setItem('home:newThemeModal:show', 'false');

      cy.get('#private').should('be.enabled');
      cy.get('#private').click({ force: true });
      cy.get('button[data-test-subj="confirm"]').click();
      cy.get('#osdOverviewPageHeader__title').should('be.visible');

      cy.get('button[id="user-icon-btn"]').click();
      cy.get('button[data-test-subj^="log-out-"]').click();
    });
    cy.wait('@openidLogout').then(() => {});

    loginWithOidc(url, {
      hideHomeModal: true,
    });

    cy.origin(osdOrigin, () => {
      cy.get('#user-icon-btn').should('be.visible');
      cy.get('#user-icon-btn').click();
      cy.get('#osdOverviewPageHeader__title').should('be.visible');
      cy.get('#tenantName').should('have.text', 'Private');
    });
  });
});
