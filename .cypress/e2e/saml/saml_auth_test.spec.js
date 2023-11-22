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

afterEach(() => {
    cy.clearCookies();
    cy.clearLocalStorage();
  });

describe('Log in via SAML', () => {
  const samlLogin = () => {
    cy.get('input[id=userName]', { timeout: 15000}).should('be.visible');
    cy.get('button[id=btn-sign-in]', { timeout: 15000 }).should('be.visible').click();
  };

  it('Login to app/opensearch_dashboards_overview#/ when SAML is enabled', () => {
    localStorage.setItem("opendistro::security::tenant::saved", "\"__user__\"");
    localStorage.setItem("home:newThemeModal:show", "false");

    cy.visit('http://localhost:5601/app/opensearch_dashboards_overview', {
      failOnStatusCode: false,
      timeout: 10000,
    });
    
    samlLogin();

    cy.get('#osdOverviewPageHeader__title', { timeout: 10000 }).should('be.visible');
    cy.getCookie('security_authentication', { timeout: 10000 }).should('exist');
  });
});
