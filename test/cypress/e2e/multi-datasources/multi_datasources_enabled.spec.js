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
  cy.request(
    'GET',
    `${Cypress.config(
      'baseUrl'
    )}/api/saved_objects/_find?fields=id&fields=description&fields=title&per_page=10000&type=data-source`
  ).then((resp) => {
    if (resp && resp.body && resp.body.saved_objects) {
      resp.body.saved_objects.map(({ id }) => {
        cy.request({
          method: 'DELETE',
          url: `${Cypress.config('baseUrl')}/api/saved_objects/data-source/${id}`,
          body: { force: false },
          headers: {
            'osd-xsrf': true,
          },
        });
      });
    }
  });
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

  it('Checks Auth Tab', () => {
    cy.visit('http://localhost:5601/app/security-dashboards-plugin#/auth');
    // Local cluster auth
    cy.get('.panel-header-count').first().invoke('text').should('contain', '(6)');
    // Remote cluster auth
    cy.get('[data-test-subj="dataSourceSelectableContextMenuHeaderLink"]').click();
    cy.contains('li.euiSelectableListItem', '9202').click();
    cy.get('.panel-header-count').first().invoke('text').should('contain', '(2)');
    cy.visit('http://localhost:5601/app/security-dashboards-plugin#/users');
    // Data source persisted across tabs
    cy.get('[data-test-subj="dataSourceSelectableContextMenuHeaderLink"]').contains('9202');
  });

  it('Checks Users Tab', () => {
    cy.visit('http://localhost:5601/app/security-dashboards-plugin#/users');
    // Create an internal user in the remote cluster
    cy.get('[data-test-subj="dataSourceSelectableContextMenuHeaderLink"]').click();
    cy.contains('li.euiSelectableListItem', '9202').click();
    cy.get('[data-test-subj="create-user"]').click();
    cy.get('[data-test-subj="name-text"]').focus().type('9202-user');
    cy.get('[data-test-subj="password"]').focus().type('myStrongPassword123!');
    cy.get('[data-test-subj="re-enter-password"]').focus().type('myStrongPassword123!');
    cy.get('[data-test-subj="submit-save-user"]').click();

    // Internal user exists on the remote
    cy.visit('http://localhost:5601/app/security-dashboards-plugin#/users');
    cy.contains('.euiTableRowCell', '9202-user').should('exist');

    // Internal user doesn't exist on local cluster
    cy.get('[data-test-subj="dataSourceSelectableContextMenuHeaderLink"]').click();
    cy.contains('li.euiSelectableListItem', 'Local cluster').click();
    cy.contains('.euiTableRowCell', '9202-user').should('not.exist');
  });
});
