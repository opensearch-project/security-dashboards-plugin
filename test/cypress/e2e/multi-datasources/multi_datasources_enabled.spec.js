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
  return cy.request({
    method: 'POST',
    url: `${Cypress.config('baseUrl')}/api/saved_objects/data-source`,
    headers: {
      'osd-xsrf': true,
    },
    body: {
      attributes: {
        title: Cypress.env('externalDataSourceLabel'),
        endpoint: Cypress.env('externalDataSourceEndpoint'),
        auth: {
          type: 'username_password',
          credentials: {
            username: Cypress.env('externalDataSourceAdminUserName'),
            password: Cypress.env('externalDataSourceAdminPassword'),
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
  return `?dataSource=${JSON.stringify(dataSourceObj).toString()}`;
};

let externalDataSourceId;
let externalDataSourceUrl;
let localDataSourceUrl;

describe('Multi-datasources enabled', () => {
  beforeEach(() => {
    localStorage.setItem('opendistro::security::tenant::saved', '""');
    localStorage.setItem('home:newThemeModal:show', 'false');
    createDataSource().then((resp) => {
      if (resp && resp.body) {
        externalDataSourceId = resp.body.id;
      }
      externalDataSourceUrl = createUrlParam(
        Cypress.env('externalDataSourceLabel'),
        externalDataSourceId
      );
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
    cy.get('[data-test-subj="dataSourceSelectableButton"]').should('contain', '9202');

    cy.get('[data-test-subj="purge-cache"]').click();
    cy.get('[class="euiToast euiToast--success euiGlobalToastListItem"]')
      .get('.euiToastHeader__title')
      .should('contain', 'successful for 9202');
  });

  it('Checks Auth Tab', () => {
    cy.visit(`http://localhost:5601/app/security-dashboards-plugin${externalDataSourceUrl}#/auth`);

    cy.get('.panel-header-count').first().invoke('text').should('contain', '(1)');
  });

  it('Checks Users Tab', () => {
    cy.request({
      method: 'POST',
      url: `http://localhost:5601/api/v1/configuration/internalusers/9202-user?dataSourceId=${externalDataSourceId}`,
      headers: {
        'osd-xsrf': true,
      },
      body: {
        backend_roles: [''],
        attributes: {},
        password: 'myStrongPassword12345678!',
      },
    }).then(() => {
      cy.visit(
        `http://localhost:5601/app/security-dashboards-plugin${externalDataSourceUrl}#/users`
      );

      cy.get('[data-test-subj="tableHeaderCell_username_0"]').click();
      cy.get('[data-test-subj="checkboxSelectRow-9202-user"]').should('exist');
    });
  });

  it('Checks Permissions Tab', () => {
    cy.request({
      method: 'POST',
      url: `http://localhost:5601/api/v1/configuration/actiongroups/9202-permission?dataSourceId=${externalDataSourceId}`,
      headers: {
        'osd-xsrf': true,
      },
      body: {
        allowed_actions: [],
      },
    }).then(() => {
      cy.visit(
        `http://localhost:5601/app/security-dashboards-plugin${externalDataSourceUrl}#/permissions`
      );

      // Permission exists on the remote data source
      cy.get('[data-test-subj="tableHeaderCell_name_0"]').click();
      cy.get('[data-test-subj="checkboxSelectRow-9202-permission"]').should('exist');
    });
  });

  it('Checks Tenancy Tab', () => {
    // Datasource is locked to local cluster for tenancy tab
    cy.visit(`http://localhost:5601/app/security-dashboards-plugin${localDataSourceUrl}#/tenants`);

    cy.contains('h1', 'Dashboards multi-tenancy');
    cy.get('[data-test-subj="dataSourceSelectableButton"]').should('not.exist');
  });

  it('Checks Audit Logs Tab', () => {
    cy.request({
      method: 'POST',
      url: `http://localhost:5601/api/v1/configuration/audit/config?dataSourceId=${externalDataSourceId}`,
      headers: {
        'osd-xsrf': true,
      },
      body: {
        compliance: {
          enabled: true,
          write_log_diffs: false,
          read_watched_fields: {},
          read_ignore_users: ['kibanaserver'],
          write_watched_indices: [],
          write_ignore_users: ['kibanaserver'],
          internal_config: false,
          read_metadata_only: false,
          write_metadata_only: false,
          external_config: false,
        },
        enabled: false,
        audit: {
          ignore_users: ['kibanaserver'],
          ignore_requests: [],
          disabled_rest_categories: ['AUTHENTICATED', 'GRANTED_PRIVILEGES'],
          disabled_transport_categories: ['AUTHENTICATED', 'GRANTED_PRIVILEGES'],
          log_request_body: true,
          resolve_indices: true,
          resolve_bulk_requests: false,
          enable_transport: true,
          enable_rest: true,
          exclude_sensitive_headers: true,
        },
      },
    }).then(() => {
      cy.visit(
        `http://localhost:5601/app/security-dashboards-plugin${externalDataSourceUrl}#/auditLogging`
      );
      cy.get('[class="euiSwitch__label"]').should('contain', 'Disabled');
    });
  });

  it('Checks Roles Tab', () => {
    cy.request({
      method: 'POST',
      url: `http://localhost:5601/api/v1/configuration/roles/9202-role?dataSourceId=${externalDataSourceId}`,
      headers: {
        'osd-xsrf': true,
      },
      body: {
        cluster_permissions: [],
        index_permissions: [],
        tenant_permissions: [],
      },
    }).then(() => {
      cy.visit(
        `http://localhost:5601/app/security-dashboards-plugin${externalDataSourceUrl}#/roles`
      );

      cy.get('[data-test-subj="dataSourceSelectableButton"]').should('contain', '9202');
      cy.get('[data-test-subj="tableHeaderCell_roleName_0"]').click();
      cy.get('[data-test-subj="checkboxSelectRow-9202-role"]').should('exist');

      // role exists on the remote
    });
  });
});
