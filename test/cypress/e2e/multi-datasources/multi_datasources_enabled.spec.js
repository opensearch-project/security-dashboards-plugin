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

const createDataSource = () => {
  cy.visit('http://localhost:5601/app/management/opensearch-dashboards/dataSources/create');
  cy.get('[data-test-subj="createDataSourceFormTitleField"]').type('9202');
  cy.get('[data-test-subj="createDataSourceFormEndpointField"]').type('http://localhost:9202');
  cy.get('[data-test-subj="createDataSourceFormUsernameField"]').type('admin');
  cy.get('[data-test-subj="createDataSourceFormPasswordField"]').type('myStrongPassword123!');
  cy.get('[data-test-subj="createDataSourceTestConnectionButton"]').click();
  cy.get('.euiToastHeader__title').should('contain', 'successful');
  cy.get('[data-test-subj="createDataSourceButton"]').click();
};

describe('Multi-datasources enabled', () => {
  it('Sanity checks the cluster selector is visible when multi datasources is enabled', () => {
    localStorage.setItem('opendistro::security::tenant::saved', '""');
    localStorage.setItem('home:newThemeModal:show', 'false');
    createDataSource();

    cy.visit('http://localhost:5601/app/security-dashboards-plugin#/getstarted');

    cy.get('[data-test-subj="dataSourceSelectableContextMenuHeaderLink"]').click();
    cy.contains('li.euiSelectableListItem', '9202').click();
    cy.get('[data-test-subj="purge-cache"]').click();
    cy.get('.euiToastHeader__title').should('contain', 'successful');
  });
});
