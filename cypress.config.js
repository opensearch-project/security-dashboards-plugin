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

const { defineConfig } = require('cypress');

module.exports = defineConfig({
  screenshotsFolder: 'test/cypress/screenshots',
  downloadsFolder: 'test/cypress/downloads',
  defaultCommandTimeout: 60000,
  requestTimeout: 60000,
  responseTimeout: 60000,
  e2e: {
    setupNodeEvents(on, config) {},
    supportFile: 'test/cypress/support/e2e.js',
    baseUrl: 'http://localhost:5601',
    specPattern: 'test/cypress/e2e/**/*.spec.js',
  },
  env: {
    openSearchUrl: 'https://localhost:9200',
    adminUserName: 'admin',
    adminPassword: 'myStrongPassword123!',
    externalDataSourceAdminUserName: 'admin',
    externalDataSourceAdminPassword: 'myStrongPassword123!',
    externalDataSourceLabel: '9202',
    externalDataSourceEndpoint: 'https://localhost:9202'
  },
});
