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

import { ADMIN_AUTH } from '../support/constants';

function login() {
  cy.visit('http://localhost:5601/app/login?nextUrl=%2Fapp%2Fsecurity-dashboards-plugin#/auth');
  cy.get('[data-testid="username"]').type(ADMIN_AUTH.username);
  cy.get('[data-testid="password"]').type(ADMIN_AUTH.password);
  cy.get('[data-testid="login"]').click();
  if (cy.contains('Cancel')) {
    cy.contains('Cancel').click();
  }
}

function logout() {
  cy.get('.euiAvatar').click();
  cy.contains('Log out').click();
}

// OpenSearch backend must have BASIC and SAML authentication options for tests to work.
describe('Testing Dashboard SignIn Options', () => {
  it('Dashboard Plugin Auth shows dashboard sign in options with their state.', () => {
    login();
    cy.contains('BASIC');
    cy.contains('Enable');
    cy.contains('SAML');
    cy.contains('Disable');
  });

  it('Login page shows Basic and Single Sign-On options.', () => {
    login();

    cy.get('[data-testid="edit"]').click();
    cy.get('#_selection_column_SAML-checkbox').check();
    cy.get('[data-testid="update"]').click();

    logout();

    cy.get('[data-testid="username"]').should('exist');
    cy.get('[data-testid="password"]').should('exist');
    cy.contains('Log in with single sign-on').should('exist');
  });

  it('Login page shows only Single Sign-On option (SAML).', () => {
    login();

    cy.get('[data-testid="edit"]').click();
    cy.get('#_selection_column_SAML-checkbox').check();
    cy.get('#_selection_column_BASIC-checkbox').uncheck();
    cy.get('[data-testid="update"]').click();

    logout();

    cy.contains('Log in with single sign-on');
    cy.get('[data-testid="username"]').should('not.exist');
    cy.get('[data-testid="password"]').should('not.exist');
  });

  it('Login page shows only Basic sign-in option.', () => {
    cy.visit('http://localhost:5601/app/login?nextUrl=%2Fapp%2Fsecurity-dashboards-plugin#/auth');
    cy.contains('Log in with single sign-on').click();

    cy.get('[name="username"]').type('user1');
    cy.get('[name="password"]').type('user1pass');
    cy.contains('Login').click();

    if (cy.contains('Cancel')) {
      cy.contains('Cancel').click();
    }

    cy.get('[data-testid="edit"]').click();
    cy.get('#_selection_column_SAML-checkbox').uncheck();
    cy.get('#_selection_column_BASIC-checkbox').check();
    cy.get('[data-testid="update"]').click();

    cy.visit('http://localhost:5601/app/login');

    cy.contains('Log in with single sign-on').should('not.exist');
    cy.get('[data-testid="username"]').should('exist');
    cy.get('[data-testid="password"]').should('exist');
  });
});
