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

import { ADMIN_AUTH } from '../../support/constants';

// Assumes OpenSearch Dashboards is running and the plugin is installed.
const BASE = 'http://localhost:5601';
// resource management app:
const ROUTE = '/app/resource_access_management';

function closeAnyOpenPopover() {
  // Close EUI popovers / super-select dropdowns by clicking outside
  cy.get('body').click(0, 0);
}

function pickSampleResourceType() {
  // Click the SuperSelect trigger (shows either selected text or "Select a type…")
  cy.contains('button.euiSuperSelectControl', /Select a type…|.+/).click();

  // Click the "Sample Resource" option in the dropdown
  cy.get('[role="listbox"]').within(() => {
    cy.contains('button:enabled', /^Sample Resource$/).click();
  });

  // Close dropdown
  closeAnyOpenPopover();
}

function findTable() {
  // Table appears only after a type is selected and rows fetched
  cy.get('table', { timeout: 20_000 }).should('exist');
}

function createSampleResource() {
  const url = 'https://localhost:9200/_plugins/sample_plugin/create';

  cy.request({
    method: 'PUT',
    url,
    body: { name: 'sample' },
    headers: { 'Content-Type': 'application/json' },
    auth: ADMIN_AUTH,
    // allow us to handle 409/400 gracefully
    failOnStatusCode: false,
  }).then((resp) => {
    if (resp.status === 200 || resp.status === 201) {
      cy.log('Sample resource created.');
    } else if (resp.status === 409 || resp.status === 400) {
      cy.log('Sample resource already exists — skipping creation.');
    } else {
      throw new Error(
        `Failed to create sample resource: ${resp.status} ${JSON.stringify(resp.body)}`
      );
    }
  });
}

function openFirstRowModal() {
  // The panel renders a labeled action button per row with
  // data-test-subj="share-button-<resourceId>" ("Share" or "Manage access").
  cy.get('table').within(() => {
    cy.get('tbody tr')
      .first()
      .within(() => {
        cy.get('[data-test-subj^="share-button-"]').as('rowAction');
      });
  });

  cy.get('@rowAction').click();

  // Modal is rendered in an EUI portal -> overlay mask exists
  cy.get('.euiOverlayMask', { timeout: 10_000 }).should('exist');
}

function addRecipientAndSubmit(isEdit) {
  // The modal seeds one access-level section in create mode and shows the
  // existing level(s) in edit mode. Target that section's Users combo box
  // directly via its data-test-subj prefix (share-access-users-<level>).
  const user = `cypress_test_user${Math.floor(Math.random() * 100)}`;
  cy.get('@overlay').within(() => {
    cy.get('[data-test-subj^="share-access-users-"]', { timeout: 10_000 })
      .first()
      .find('input')
      .first()
      .type(`${user}{enter}`);
  });

  // Primary action: "Share" (create) or "Save changes" (edit)
  cy.get('@overlay').within(() => {
    cy.get('[data-test-subj="share-access-modal-submit"]').should('be.enabled').click();
  });

  // Edit mode surfaces a confirmation dialog before applying changes
  if (isEdit) {
    cy.get('[data-test-subj="share-access-confirm-modal"]', { timeout: 10_000 })
      .contains('button', /Save changes/i)
      .click();
  }

  // Success toast & modal closes; table back
  const successText = isEdit ? 'Access updated.' : 'Resource shared.';
  cy.contains('.euiToast', successText, { timeout: 10_000 }).should('exist');

  cy.get('.euiOverlayMask').should('not.exist');
  findTable();
}

describe('Resource Access Management Dashboard', () => {
  before(() => {
    createSampleResource();
  });
  beforeEach(() => {
    cy.clearCookies();
    cy.clearAllLocalStorage();
    cy.clearAllSessionStorage();
    localStorage.setItem('opendistro::security::tenant::saved', '""');
    localStorage.setItem('home:newThemeModal:show', 'false');
  });

  it('loads the Resource Access page', () => {
    cy.visit(BASE + ROUTE);
    cy.contains('h1', 'Resource Access Management', { timeout: 20_000 }).should('be.visible');
    cy.contains('h3', 'Resources').should('be.visible');
    cy.contains(
      'div',
      'Pick a resource type from the dropdown to load accessible resources.'
    ).should('be.visible');
  });

  it('renders data source picker when data source is enabled', () => {
    cy.visit(BASE + ROUTE);

    // Wait for page to load
    cy.contains('h1', 'Resource Access Management', { timeout: 20_000 }).should('be.visible');

    // Check if data source picker is rendered (when MDS is enabled)
    // The data source picker uses data-test-subj="dataSourceSelectableButton" or "dataSourceViewButton"
    cy.get('body').then(($body) => {
      const hasSelectableButton = $body.find(
        '[data-test-subj="dataSourceSelectableButton"]'
      ).length;
      const hasViewButton = $body.find('[data-test-subj="dataSourceViewButton"]').length;

      if (hasSelectableButton) {
        cy.get('[data-test-subj="dataSourceSelectableButton"]').should('be.visible');
        cy.log('Data source picker (selectable) is enabled and visible');
      } else if (hasViewButton) {
        cy.get('[data-test-subj="dataSourceViewButton"]').should('be.visible');
        cy.log('Data source picker (view-only) is enabled and visible');
      } else {
        // Data source is not enabled - this is also valid for local cluster mode
        cy.log('Data source picker is not enabled (local cluster mode)');
      }
    });
  });

  it('uses correct data source when making API calls', () => {
    // Set up intercept before visiting the page
    cy.intercept('GET', '/api/resource/types*').as('getResourceTypes');

    cy.visit(BASE + ROUTE);

    // Wait for page to load
    cy.contains('h1', 'Resource Access Management', { timeout: 20_000 }).should('be.visible');

    // Trigger the API call by selecting a resource type
    pickSampleResourceType();

    // Verify the API was called and check the URL
    cy.wait('@getResourceTypes', { timeout: 10_000 }).then((interception) => {
      const url = interception.request.url;
      cy.log(`API call: ${url}`);

      // Check if dataSourceId query param is present
      if (url.includes('dataSourceId=')) {
        cy.log('dataSourceId parameter found in API call');
      } else {
        cy.log('No dataSourceId parameter (local cluster mode)');
      }
    });
  });

  it('selects the first available type and loads the table (rows may be empty)', () => {
    cy.visit(BASE + ROUTE);
    pickSampleResourceType();
    // Table exists whether or not there are rows
    findTable();
  });

  it('opens Share/Update modal on first row (if rows exist), adds a recipient, and submits', () => {
    cy.visit(BASE + ROUTE);
    pickSampleResourceType();
    findTable();

    // If there are zero rows, gracefully skip the modal flow
    cy.get('table').within(() => {
      cy.get('tbody tr').then(($rows) => {
        if ($rows.length === 0) {
          cy.log('No rows present; skipping modal flow.');
          this.skip();
        }
      });
    });

    // Open modal from first data row
    openFirstRowModal();

    // Determine which flow we are in by looking at the modal header

    cy.get('.euiOverlayMask', { timeout: 10_000 }).as('overlay');

    cy.get('@overlay')
      .find('.euiModalHeader')
      .invoke('text')
      .then((txt) => {
        // Header is "Share resource" (create) or "Manage access" (edit)
        const isEdit = /Manage access/i.test(txt);

        addRecipientAndSubmit(isEdit);
      });

    // TODO expand these tests by creating a user and verifying access before and after. Also ensure that sample resource is available. (Maybe put a dummy entry in sharing index directly?)
    // OR maybe install sample-plugin and create a resource there?
  });
});
