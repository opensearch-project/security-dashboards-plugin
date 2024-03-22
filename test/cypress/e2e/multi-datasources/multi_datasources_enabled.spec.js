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
  cy.request({
    method: 'POST',
    url: `${Cypress.config('baseUrl')}/api/saved_objects/data-source`,
    headers: {
      'osd-xsrf': true,
    },
    body: {
      attributes: {
        title: `9202`,
        endpoint: `http://localhost:9202`,
        auth: {
          type: 'username_password',
          credentials: {
            username: 'admin',
            password: 'myStrongPassword123!',
          },
        },
      },
    },
  });
};

const deleteAllDataSources = () => {
  cy.visit('http://localhost:5601/app/management/opensearch-dashboards/dataSources');
  cy.get('[data-test-subj="checkboxSelectAll"]').click();
  cy.get('[data-test-subj="deleteDataSourceConnections"]').click();
  cy.get('[data-test-subj="confirmModalConfirmButton"]').click();
};

describe('Multi-datasources enabled', () => {
  before(() => {
    localStorage.setItem('opendistro::security::tenant::saved', '""');
    localStorage.setItem('home:newThemeModal:show', 'false');
    createDataSource();
  });

  after(() => {
    deleteAllDataSources();
    cy.clearLocalStorage();
  });

  it('Checks Get Started Tab', () => {
    cy.visit('http://localhost:5601/app/security-dashboards-plugin#/getstarted');
    // Local cluster purge cache
    cy.get('[data-test-subj="purge-cache"]').click();
    cy.get('.euiToastHeader__title').should('contain', 'successful for Local cluster');
    // Remote cluster purge cache
    cy.get('[data-test-subj="dataSourceSelectableContextMenuHeaderLink"]').click();
    cy.contains('li.euiSelectableListItem', '9202').click();
    cy.get('[data-test-subj="purge-cache"]').click();
    cy.get('.euiToastHeader__title').should('contain', 'successful for 9202');
    cy.visit('http://localhost:5601/app/security-dashboards-plugin#/auth');
    // Data source persisted across tabs
    cy.get('[data-test-subj="dataSourceSelectableContextMenuHeaderLink"]').contains('9202');
  });

  it('Checks Get Started Tab', () => {
    cy.visit('http://localhost:5601/app/security-dashboards-plugin#/auth');
    // Local cluster auth
    cy.get('.panel-header-count').first().invoke('text').should('contain', '(6)');
    // Remote cluster auth
    cy.get('[data-test-subj="dataSourceSelectableContextMenuHeaderLink"]').click();
    cy.contains('li.euiSelectableListItem', '9202').click();
    cy.get('.container .panel-header-count').first().invoke('text').should('eq', '(2)');
  });
});
