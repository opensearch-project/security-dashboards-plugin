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

describe('Multi-datasources enabled', () => {
  it('Sanity checks the cluster selector is not visible when multi datasources is disabled', () => {
    localStorage.setItem('opendistro::security::tenant::saved', '""');
    localStorage.setItem('home:newThemeModal:show', 'false');

    cy.visit('http://localhost:5601/app/security-dashboards-plugin#/getstarted', {
      failOnStatusCode: false,
    });

    cy.get('[data-test-subj="dataSourceSelectableContextMenuHeaderLink"]').should('not.exist');
  });
});
