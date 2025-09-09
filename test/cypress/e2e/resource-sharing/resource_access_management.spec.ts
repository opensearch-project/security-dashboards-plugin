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

// Assumes OpenSearch Dashboards is running and the plugin is installed.
declare const Cypress: any;
const BASE =
  (Cypress && Cypress.env ? Cypress.env('DASHBOARDS_URL') : undefined) || 'http://localhost:5601';
// resource management app:
const ROUTE = '/app/resource_access_management';

function closeAnyOpenPopover() {
  // Close EUI popovers / super-select dropdowns to avoid stray act/portal updates
  cy.get('body').type('{esc}', { force: true });
}

function pickFirstType() {
  // Click the SuperSelect trigger (shows either selected text or "Select a type…")
  cy.contains('button.euiSuperSelectControl', /Select a type…|.+/).click();

  // Choose the first real item in the dropdown (ignore placeholder)
  // EUI renders items as listbox > button; pick the first enabled option
  cy.get('[role="listbox"] button:enabled').first().click();

  // Close dropdown
  closeAnyOpenPopover();
}

function findTable() {
  // Table appears only after a type is selected and rows fetched
  cy.get('table', { timeout: 20_000 }).should('exist');
}

function openFirstRowModal() {
  // Prefer the first row; the table component sets data-test-subj="row-<id>"
  // But we don’t know the ID, so use the first row’s action cell.
  cy.get('table').within(() => {
    // Look for a visible row action button (Share or Update Access)
    cy.get('tr')
      .eq(1) // skip header (row 0)
      .within(() => {
        cy.contains('button', /^Share$|^Update Access$/).as('rowAction');
      });
  });

  cy.get('@rowAction').click();

  // Modal is rendered in an EUI portal -> overlay mask exists
  cy.get('.euiOverlayMask', { timeout: 10_000 }).should('exist');
}

function addRecipientAndSubmit(expectLabel: 'Share' | 'Update Access') {
  // Ensure there is at least one action-group panel (create one if missing)
  cy.get('@overlay').then(($ov) => {
    if ($ov.text().includes('No action-groups added yet.')) {
      cy.wrap($ov)
        .contains('button', /Add action-group/i)
        .click();
    }
  });

  // Use the 2nd combobox in the modal (index 1) = Users
  cy.get('@overlay').within(() => {
    cy.get('[role="combobox"]', { timeout: 10_000 }).eq(1).as('usersInput');
  });

  // Wipe all existing pills for that combobox
  cy.get('@overlay').within(() => {
    cy.get('@usersInput')
      .closest('.euiComboBox')
      .as('usersBox')
      .then(($box) => {
        const SEL = [
          '[data-test-subj="comboBoxPill"] button[aria-label="Remove option"]',
          '.euiComboBoxPill__removeButton',
          '.euiBadge__iconButton[aria-label*="Remove"]',
        ].join(', ');

        const $btns = $box.find(SEL); // jQuery find — NO Cypress retrying
        if ($btns.length) {
          // clear existing entries
          cy.wrap($btns).each(($btn) => cy.wrap($btn).click({ force: true }));
        }
      });
  });

  // Type a user into combobox[1] and commit with Enter
  const user = `cypress_test_user${Math.floor(Math.random() * 100)}`;
  cy.get('@overlay').within(() => {
    cy.get('@usersInput').type(`${user}{enter}`);
  });

  // Click the primary button ("Share" or "Update Access")
  cy.get('@overlay').within(() => {
    cy.contains('button', new RegExp(`^${expectLabel}$`))
      .should('be.enabled')
      .click();
  });

  // Success toast & modal closes; table back
  const successText = expectLabel === 'Share' ? 'Resource shared.' : 'Access updated.';
  cy.contains('.euiToast', successText, { timeout: 10_000 }).should('exist');

  cy.get('.euiOverlayMask').should('not.exist');
  findTable();
}

describe('Resource Access Management Dashboard', () => {
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

  it('selects the first available type and loads the table (rows may be empty)', () => {
    cy.visit(BASE + ROUTE);
    pickFirstType();
    // Table exists whether or not there are rows
    findTable();
  });

  it('opens Share/Update modal on first row (if rows exist), adds a recipient, and submits', () => {
    cy.visit(BASE + ROUTE);
    pickFirstType();
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
        const mode: 'Share' | 'Update Access' = /Update Access/i.test(txt)
          ? 'Update Access'
          : 'Share';

        addRecipientAndSubmit(mode);
      });

    // TODO expand these tests by creating a user and verifying access before and after. Also ensure that sample resource is available. (Maybe put a dummy entry in sharing index directly?)
    // OR maybe install sample-plugin and create a resource there?
  });
});
