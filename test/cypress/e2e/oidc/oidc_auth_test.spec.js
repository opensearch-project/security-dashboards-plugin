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

const login = 'admin';
const password = 'admin';

describe('Log in via OIDC', () => {
  afterEach(() => {
    cy.origin('http://localhost:5601', () => {
      cy.clearCookies();
      cy.clearLocalStorage();
    });
  });

  const kcLogin = () => {
    cy.get('#kc-page-title').should('be.visible');
    cy.get('input[id=username]').should('be.visible').type(login);
    cy.get('input[id=password]').should('be.visible').type(password);
    cy.get('#kc-login').click();
  };

  it('Login to app/opensearch_dashboards_overview#/ when OIDC is enabled', () => {
    cy.visit('http://localhost:5601/app/opensearch_dashboards_overview', {
      failOnStatusCode: false,
    });

    kcLogin();

    cy.origin('http://localhost:5601', () => {
      localStorage.setItem('opendistro::security::tenant::saved', '""');
      localStorage.setItem('home:newThemeModal:show', 'false');

      cy.get('#osdOverviewPageHeader__title').should('be.visible');

      cy.getCookie('security_authentication').should('exist');
    });
  });

  it('Login to app/dev_tools#/console when OIDC is enabled', () => {
    cy.visit('http://localhost:5601/app/opensearch_dashboards_overview', {
      failOnStatusCode: false,
    });

    kcLogin();

    cy.origin('http://localhost:5601', () => {
      localStorage.setItem('opendistro::security::tenant::saved', '""');
      localStorage.setItem('home:newThemeModal:show', 'false');

      cy.visit('http://localhost:5601/app/dev_tools#/console');

      cy.get('a').contains('Dev Tools').should('be.visible');

      cy.getCookie('security_authentication').should('exist');
    });
  });

  it('Login to Dashboard with Hash', () => {
    cy.visit(
      `http://localhost:5601/app/dashboards#/view/7adfa750-4c81-11e8-b3d7-01146121b73d?_g=(filters:!(),refreshInterval:(pause:!f,value:900000),time:(from:now-24h,to:now))&_a=(description:'Analyze%20mock%20flight%20data%20for%20OpenSearch-Air,%20Logstash%20Airways,%20OpenSearch%20Dashboards%20Airlines%20and%20BeatsWest',filters:!(),fullScreenMode:!f,options:(hidePanelTitles:!f,useMargins:!t),query:(language:kuery,query:''),timeRestore:!t,title:'%5BFlights%5D%20Global%20Flight%20Dashboard',viewMode:view)`
    );

    kcLogin();

    cy.origin('http://localhost:5601', () => {
      localStorage.setItem('opendistro::security::tenant::saved', '""');
      localStorage.setItem('home:newThemeModal:show', 'false');

      cy.get('.euiHeader.euiHeader--default.euiHeader--fixed.primaryHeader').should('be.visible');

      cy.getCookie('security_authentication').should('exist');
    });
  });

  it('Tenancy persisted after logout in OIDC', () => {
    cy.visit('http://localhost:5601/app/opensearch_dashboards_overview#/', {
      failOnStatusCode: false,
    });

    kcLogin();

    cy.origin('http://localhost:5601', () => {
      localStorage.setItem('home:newThemeModal:show', 'false');

      cy.get('#private').should('be.enabled');
      cy.get('#private').click({ force: true });

      cy.get('button[data-test-subj="confirm"]').click();

      cy.get('#osdOverviewPageHeader__title').should('be.visible');

      cy.get('button[id="user-icon-btn"]').click();

      cy.get('button[data-test-subj^="log-out-"]').click();
    });

    kcLogin();

    cy.origin('http://localhost:5601', () => {
      cy.get('#user-icon-btn').should('be.visible');
      cy.get('#user-icon-btn').click();

      cy.get('#osdOverviewPageHeader__title').should('be.visible');

      cy.get('#tenantName').should('have.text', 'Private');
    });
  });
});
