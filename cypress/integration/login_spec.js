/*
 *   Copyright 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
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

describe('Login succeeds', () => {
  it('successfully logs in', () => {
    cy.visit(`${Cypress.env('kibana')}`);
    // change URL to match your dev URL

    cy.get('[data-test-subj="user-name"]', { timeout: 60000 }).type('admin', { force: true });

    // {enter} causes the form to submit
    cy.get('[data-test-subj="password"]').type('admin{enter}', { force: true });

    cy.url().should('contain', '/home');
  });
});

describe('Login fails', () => {
  it('logs in fails', () => {
    cy.visit(`${Cypress.env('kibana')}`);
    // change URL to match your dev URL

    cy.get('[data-test-subj="user-name"]', { timeout: 60000 }).type('admin2', { force: true });

    // {enter} causes the form to submit
    cy.get('[data-test-subj="password"]').type('admin{enter}', { force: true });

    cy.get('#error').should('exist');
  });
});
