// type definitions for custom commands like "createDefaultTodos"
/// <reference types="cypress" />

declare namespace Cypress {
  interface Chainable<Subject> {
    /**
     * Create a role mapping by calling REST API
     * @example
     * cy.createRoleMapping('role_name', rolemappingJsonFixture )
     */
     createRoleMapping<S = any>(
        roleID: string,
        rolemappingJson: string
      ): Chainable<S>;
  }
}