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

// type definitions for custom commands like "createDefaultTodos"
// / <reference types="cypress" />

declare namespace Cypress {
  interface Chainable<Subject> {
    /**
     * Create a test tenant by calling REST API
     * @example
     * cy.createTenant('test_tenant', tenantJsonFixture )
     */
    createTenant<S = any>(tenantID: string, tenantJson: string): Chainable<S>;
  }

  interface Chainable<Subject> {
    /**
     * Create an internal user by calling REST API
     * @example
     * cy.createInternalUser('test_user', userJsonFixture )
     */
    createInternalUser<S = any>(userID: string, userJson: string): Chainable<S>;
  }

  interface Chainable<Subject> {
    /**
     * Create a role by calling REST API
     * @example
     * cy.createRole('role_name', roleJsonFixture )
     */
    createRole<S = any>(roleID: string, roleJson: string): Chainable<S>;
  }

  interface Chainable<Subject> {
    /**
     * Create a role mapping by calling REST API
     * @example
     * cy.createRoleMapping('role_name', rolemappingJsonFixture )
     */
    createRoleMapping<S = any>(roleID: string, rolemappingJson: string): Chainable<S>;
  }

  interface Chainable<Subject> {
    /**
     * Generate a UUID for the passed URL and store it in the tenant index.
     * @example :
     * cy.shortenUrl({url: "/app/home#/tutorial_directory"}, 'global')
     *
     * @param data - The Object which contains the url.
     * @param tenant - The tenant index which will store the UUID
     */
    shortenUrl<S = any>(data: object, tenant: string): Chainable<S>;
  }
}
