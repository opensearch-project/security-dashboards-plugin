// type definitions for custom commands like "createDefaultTodos"
/// <reference types="cypress" />

declare namespace Cypress {
  interface Chainable<Subject> {
    /**
     * Create a test tenant by calling REST API
     * @example
     * cy.createTenant('test_tenant', tenantJsonFixture )
     */
     createTenant<S = any>(
        tenantID: string,
        tenantJson: string
      ): Chainable<S>;
  }

  interface Chainable<Subject> {
    /**
     * Create an internal user by calling REST API
     * @example
     * cy.createInternalUser('test_user', userJsonFixture )
     */
     createInternalUser<S = any>(
        userID: string,
        userJson: string
      ): Chainable<S>;
  }

  interface Chainable<Subject> {
    /**
     * Create a role by calling REST API
     * @example
     * cy.createRole('role_name', roleJsonFixture )
     */
     createRole<S = any>(
        roleID: string,
        roleJson: string
      ): Chainable<S>;
  }

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
