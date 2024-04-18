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

const externalTitle = '9202';
const createDataSource = () => {
  return cy.request({
    method: 'POST',
    url: `${Cypress.config('baseUrl')}/api/saved_objects/data-source`,
    headers: {
      'osd-xsrf': true,
    },
    body: {
      attributes: {
        title: externalTitle,
        endpoint: 'https://localhost:9202',
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

const createUrlParam = (label, id) => {
  const dataSourceObj = { label, id };

  return `?dataSource=${JSON.stringify(dataSourceObj)}`;
};

let externalDataSourceId;
let externalDataSourceUrl;
let localDataSourceUrl;

describe('Multi-datasources enabled', () => {
  beforeEach(() => {
    deleteAllDataSources();
    localStorage.setItem('opendistro::security::tenant::saved', '""');
    localStorage.setItem('home:newThemeModal:show', 'false');
    createDataSource().then((resp) => {
      if (resp && resp.body) {
        externalDataSourceId = resp.body.id;
      }
      externalDataSourceUrl = createUrlParam(externalTitle, externalDataSourceId);
      localDataSourceUrl = createUrlParam('Local cluster', '');
    });
  });

  afterEach(() => {
    cy.clearCookies();
    cy.clearAllLocalStorage();
    cy.clearAllSessionStorage();
    deleteAllDataSources();
  });

  it('Checks Get Started Tab', () => {
    // Remote cluster purge cache
    cy.visit(
      `http://localhost:5601/app/security-dashboards-plugin${externalDataSourceUrl}#/getstarted`
    );

    cy.contains('h1', 'Get started');
    cy.get('[data-test-subj="dataSourceSelectableContextMenuHeaderLink"]').should(
      'contain',
      '9202'
    );

    cy.get('[data-test-subj="purge-cache"]').click();
    cy.get('[class="euiToast euiToast--success euiGlobalToastListItem"]')
      .get('.euiToastHeader__title')
      .should('contain', 'successful for 9202');
  });

  it('Checks Auth Tab', () => {
    cy.visit(`http://localhost:5601/app/security-dashboards-plugin${externalDataSourceUrl}#/auth`);

    cy.get('.panel-header-count').first().invoke('text').should('contain', '(2)');
  });

  it('Checks Users Tab', () => {
    // select remote data source
    cy.visit(`http://localhost:5601/app/security-dashboards-plugin${externalDataSourceUrl}#/users`);

    // create a user on remote data source
    cy.get('[data-test-subj="create-user"]').click();
    cy.get('[data-test-subj="name-text"]').focus().type('9202-user');
    cy.get('[data-test-subj="password"]').focus().type('myStrongPassword123!');
    cy.get('[data-test-subj="re-enter-password"]').focus().type('myStrongPassword123!');
    cy.get('[data-test-subj="submit-save-user"]').click();

    // Internal user exists on the remote
    cy.get('[data-test-subj="dataSourceSelectableContextMenuHeaderLink"]').should(
      'contain',
      '9202'
    );
    cy.get('[data-test-subj="tableHeaderCell_username_0"]').click();
    cy.get('[data-test-subj="checkboxSelectRow-9202-user"]').should('exist');
  });

  it.skip('Checks Permissions Tab', () => {
    // Select remote cluster
    cy.visit(
      `http://localhost:5601/app/security-dashboards-plugin${externalDataSourceUrl}#/permissions`
    );

    cy.get('[data-test-subj="dataSourceSelectableContextMenuHeaderLink"]').should(
      'contain',
      '9202'
    );

    // Create an action group
    cy.get('[id="Create action group"]').click();
    cy.get('[id="create-from-blank"]').click();
    cy.get('[data-test-subj="name-text"]')
      .focus()
      .type('9202-permission', { force: true })
      .should('have.value', '9202-permission');
    cy.get('[data-test-subj="comboBoxInput"]').focus().type('some_permission');
    cy.get('[id="submit"]').click();

    // Permission exists on the remote data source
    cy.get('[data-test-subj="tableHeaderCell_name_0"]').click();
    cy.get('[data-test-subj="checkboxSelectRow-9202-permission"]').should('exist');
  });

  it('Checks Tenancy Tab', () => {
    // Datasource is locked to local cluster for tenancy tab
    cy.visit(`http://localhost:5601/app/security-dashboards-plugin${localDataSourceUrl}#/tenants`);

    cy.contains('h1', 'Dashboards multi-tenancy');
    cy.get('[data-test-subj="dataSourceViewContextMenuHeaderLink"]').should(
      'contain',
      'Local cluster'
    );
    cy.get('[data-test-subj="dataSourceViewContextMenuHeaderLink"]').should('be.disabled');
  });

  it('Checks Service Accounts Tab', () => {
    // Datasource is locked to local cluster for service accounts tab
    cy.visit(
      `http://localhost:5601/app/security-dashboards-plugin${localDataSourceUrl}#/serviceAccounts`
    );

    cy.get('[data-test-subj="dataSourceViewContextMenuHeaderLink"]').should(
      'contain',
      'Local cluster'
    );
    cy.get('[data-test-subj="dataSourceViewContextMenuHeaderLink"]').should('be.disabled');
  });

  it('Checks Audit Logs Tab', () => {
    // Select remote cluster
    cy.visit(
      `http://localhost:5601/app/security-dashboards-plugin${externalDataSourceUrl}#/auditLogging`
    );

    cy.get('[data-test-subj="dataSourceSelectableContextMenuHeaderLink"]').should(
      'contain',
      '9202'
    );

    cy.get('[data-test-subj="general-settings-configure"]').click();
    cy.get('[data-test-subj="dataSourceViewContextMenuHeaderLink"]').should('contain', '9202');

    cy.get('[data-test-subj="comboBoxInput"]').last().type('blah');
    cy.get('[data-test-subj="save"]').click();
    cy.get('[data-test-subj="dataSourceSelectableContextMenuHeaderLink"]').should(
      'contain',
      '9202'
    );

    cy.get('[data-test-subj="general-settings"]').should('contain', 'blah');
  });

  it.skip('Checks Roles Tab', () => {
    Cypress.on('uncaught:exception', (err) => !err.message.includes('ResizeObserver'));
    // select remote data source
    cy.visit(`http://localhost:5601/app/security-dashboards-plugin${externalDataSourceUrl}#/roles`);

    // create a role on remote data source
    cy.get('[data-test-subj="create-role"]').click();
    cy.contains('h1', 'Create Role');
    cy.get('[data-test-subj="name-text"]').focus().type('9202-role');
    cy.get('[data-test-subj="create-or-update-role"]').click();

    cy.get('[class="euiToast euiToast--success euiGlobalToastListItem"]')
      .get('.euiToastHeader__title')
      .should('contain', 'Role "9202-role" successfully created');

    // role exists on the remote
    cy.visit(`http://localhost:5601/app/security-dashboards-plugin${externalDataSourceUrl}#/roles`);

    cy.get('[data-test-subj="dataSourceSelectableContextMenuHeaderLink"]').should(
      'contain',
      '9202'
    );
    cy.get('[data-test-subj="tableHeaderCell_roleName_0"]').click();
    cy.get('[data-test-subj="checkboxSelectRow-9202-role"]').should('exist');
  });
});
