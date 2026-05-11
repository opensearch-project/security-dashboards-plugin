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
const idpOrigin = new URL(Cypress.env('idpUrl') || 'http://localhost:7000').origin;
const osdOrigin = 'http://localhost:5601';

Cypress.on('uncaught:exception', (err) => {
  if (err.message.includes("Cannot read properties of null (reading 'postMessage')")) {
    return false;
  }
});

before(() => {
  cy.intercept('https://localhost:9200');

  // Avoid Cypress locking onto the OpenSearch origin before the browser has
  // visited OpenSearch Dashboards. This matters for the SAML cross-origin flow.
  if (Cypress.env('loginMethod') === 'saml_multiauth') {
    cy.visit(`http://localhost:5601${basePath}`);
  } else {
    cy.request({
      url: `http://localhost:5601${basePath}`,
      auth: null,
    });
  }

  cy.createRoleMapping(ALL_ACCESS_ROLE, samlUserRoleMapping);
  cy.clearAllCookies();
  cy.clearAllLocalStorage();
});

afterEach(() => {
  cy.clearAllCookies();
  cy.clearAllLocalStorage();
});

describe('Log in via SAML', () => {
  const submitIdpLogin = () => {
    cy.get('input[id=userName]').should('be.visible');
    cy.get('button[id=btn-sign-in]').should('be.visible').click();
  };

  const submitIdpLoginIfNeeded = () => {
    cy.location('origin', { timeout: 60000 }).should('eq', idpOrigin);
    submitIdpLogin();
  };

  const runOnOsd = (callback) => {
    if (Cypress.env('loginMethod') === 'saml_multiauth') {
      callback();
    } else {
      cy.origin(osdOrigin, callback);
    }
  };

  const loginWithSamlMultiauth = () => {
    cy.get('a[aria-label="saml_login_button"]').should('be.visible');
    cy.get('a[aria-label="saml_login_button"]').should('be.visible').click();
    cy.location('origin', { timeout: 60000 }).should('eq', idpOrigin);
    cy.origin(idpOrigin, () => {
      cy.get('input[id=userName]').should('be.visible');
      cy.get('button[id=btn-sign-in]').should('be.visible').click();
    });
    cy.location('origin', { timeout: 60000 }).should('not.eq', idpOrigin);
    cy.getCookie('security_authentication', { timeout: 60000 }).should('exist');
  };

  const loginWithSaml = (url, options = {}) => {
    const samlLoginUrl = new URL(`${osdOrigin}${basePath}/auth/saml/login`);
    const targetUrl = new URL(url);
    const nextUrl = `${targetUrl.pathname}${targetUrl.search}${targetUrl.hash}`;

    samlLoginUrl.searchParams.set('redirectHash', 'false');
    samlLoginUrl.searchParams.set('nextUrl', nextUrl);

    cy.visit(samlLoginUrl.toString(), {
      failOnStatusCode: false,
    });

    submitIdpLoginIfNeeded();

    cy.location('origin', { timeout: 60000 }).should('not.eq', idpOrigin);
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

  it('Login to app/opensearch_dashboards_overview#/ when SAML is enabled', () => {
    localStorage.setItem('opendistro::security::tenant::saved', '"__user__"');
    localStorage.setItem('home:newThemeModal:show', 'false');

    const url = `${osdOrigin}${basePath}/app/opensearch_dashboards_overview`;
    if (Cypress.env('loginMethod') === 'saml_multiauth') {
      cy.visit(url, {
        failOnStatusCode: false,
      });
      loginWithSamlMultiauth();
    } else {
      loginWithSaml(url, {
        savedTenant: '"__user__"',
        hideHomeModal: true,
      });
    }

    runOnOsd(() => {
      cy.get('#osdOverviewPageHeader__title').should('be.visible');
      cy.getCookie('security_authentication').should('exist');
    });
  });

  it('Login to app/dev_tools#/console when SAML is enabled', () => {
    localStorage.setItem('opendistro::security::tenant::saved', '"__user__"');
    localStorage.setItem('home:newThemeModal:show', 'false');

    const url = `${osdOrigin}${basePath}/app/dev_tools#/console`;
    if (Cypress.env('loginMethod') === 'saml_multiauth') {
      cy.visit(url, {
        failOnStatusCode: false,
      });
      loginWithSamlMultiauth();
    } else {
      loginWithSaml(url, {
        savedTenant: '"__user__"',
        hideHomeModal: true,
      });
    }

    runOnOsd(() => {
      cy.get('a.euiBreadcrumb--last').contains('Dev Tools');
      cy.getCookie('security_authentication').should('exist');
    });
  });

  it('Login to Dashboard with Hash', () => {
    localStorage.setItem('opendistro::security::tenant::saved', '"__user__"');
    localStorage.setItem('home:newThemeModal:show', 'false');

    const urlWithHash = `${osdOrigin}${basePath}/app/security-dashboards-plugin#/getstarted`;

    if (Cypress.env('loginMethod') === 'saml_multiauth') {
      cy.visit(urlWithHash, {
        failOnStatusCode: false,
      });
      loginWithSamlMultiauth();
    } else {
      loginWithSaml(urlWithHash, {
        savedTenant: '"__user__"',
        hideHomeModal: true,
      });
    }

    runOnOsd(() => {
      cy.get('h1').contains('Get started');
      cy.getCookie('security_authentication').should('exist');
    });
  });

  it('Tenancy persisted after logout in SAML', () => {
    localStorage.setItem('home:newThemeModal:show', 'false');

    const url = `${osdOrigin}${basePath}/app/opensearch_dashboards_overview`;
    if (Cypress.env('loginMethod') === 'saml_multiauth') {
      cy.visit(url, {
        failOnStatusCode: false,
      });
      loginWithSamlMultiauth();
    } else {
      loginWithSaml(url, {
        hideHomeModal: true,
      });
    }

    cy.intercept('GET', `${basePath}/auth/saml/logout`).as('samlLogout');
    runOnOsd(() => {
      cy.get('#private').should('be.enabled');
      cy.get('#private').click({ force: true });

      cy.get('button[data-test-subj="confirm"]').click();

      cy.get('#osdOverviewPageHeader__title').should('be.visible');

      cy.get('button[id="user-icon-btn"]').click();

      cy.get('button[data-test-subj^="log-out-"]').click();
    });
    cy.wait('@samlLogout').then(() => {});
    cy.clearAllCookies();

    if (Cypress.env('loginMethod') === 'saml_multiauth') {
      cy.visit(url, {
        failOnStatusCode: false,
      });
      loginWithSamlMultiauth();
    } else {
      loginWithSaml(url, {
        hideHomeModal: true,
      });
    }

    runOnOsd(() => {
      cy.get('#user-icon-btn').should('be.visible');
      cy.get('#user-icon-btn').click();

      cy.get('#osdOverviewPageHeader__title').should('be.visible');

      cy.get('#tenantName').should('have.text', 'Private');
    });
  });

  it('Login to Dashboard with Goto URL', () => {
    localStorage.setItem('home:newThemeModal:show', 'false');
    cy.shortenUrl(SHORTEN_URL_DATA, 'global').then((response) => {
      // We need to explicitly clear cookies,
      // since the Shorten URL api is return's set-cookie header for admin user.
      cy.clearCookies().then(() => {
        const gotoUrl = `${osdOrigin}${basePath}/goto/${response.urlId}?security_tenant=global`;
        if (Cypress.env('loginMethod') === 'saml_multiauth') {
          cy.visit(gotoUrl, {
            failOnStatusCode: false,
          });
          loginWithSamlMultiauth();
        } else {
          loginWithSaml(gotoUrl);
        }
        runOnOsd(() => {
          cy.getCookie('security_authentication').should('exist');
        });
      });
    });
  });
});
