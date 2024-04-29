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

describe('Multi-datasources disabled', () => {
  beforeEach(() => {
    localStorage.setItem('opendistro::security::tenant::saved', '""');
    localStorage.setItem('home:newThemeModal:show', 'false');
  });

  afterEach(() => {
    cy.clearCookies();
    cy.clearAllLocalStorage();
    cy.clearAllSessionStorage();
  });

  it('Checks Get Started Tab', () => {
    // Remote cluster purge cache
    cy.visit(`http://localhost:5601/app/security-dashboards-plugin#/getstarted`);

    cy.contains('h1', 'Get started');
    cy.get('[data-test-subj="dataSourceSelectableButton"]').should('not.exist');

    cy.get('[data-test-subj="purge-cache"]').click();
    cy.get('[class="euiToast euiToast--success euiGlobalToastListItem"]')
      .get('.euiToastHeader__title')
      .should('contain', 'Cache purge successful');
  });
});
