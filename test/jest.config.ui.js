/*
 * Copyright OpenSearch Contributors
 *
 * Licensed under the Apache License, Version 2.0 (the "License").
 * You may not use this file except in compliance with the License.
 * A copy of the License is located at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * or in the "license" file accompanying this file. This file is distributed
 * on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either
 * express or implied. See the License for the specific language governing
 * permissions and limitations under the License.
 */

import config from '../../../src/dev/jest/config';

export default {
  ...config,
  moduleNameMapper: {
    ...config.moduleNameMapper,
    // The shared query-string shim resolves the package via process.cwd(), which the
    // plugin's custom test runner leaves pointing at the plugin dir (no node_modules there).
    // Use a plugin-local shim that resolves relative to its own file location instead.
    '^query-string$':
      '<rootDir>/plugins/security-dashboards-plugin/test/mocks/query_string_mock.js',
  },
  roots: ['<rootDir>/plugins/security-dashboards-plugin'],
  testMatch: ['**/public/**/*.test.{ts,tsx,js,jsx}', '**/common/*.test.{ts, tsx}'],
  testPathIgnorePatterns: [
    '<rootDir>/plugins/security-dashboards-plugin/build/',
    '<rootDir>/plugins/security-dashboards-plugin/node_modules/',
  ],
  // Preserve the base setupFilesAfterEnv chain (jest-location-mock, mocks.js which
  // provides matchMedia/localStorage/HOST for jsdom 26, react_testing_library, monaco_mock)
  // which the previous override dropped, then keep the plugin-specific integration timeout.
  setupFilesAfterEnv: [
    ...config.setupFilesAfterEnv,
    '<rootDir>/src/dev/jest/setup/after_env.integration.js',
  ],
  collectCoverageFrom: [
    '<rootDir>/plugins/security-dashboards-plugin/public/**/*.{ts,tsx}',
    '!<rootDir>/plugins/security-dashboards-plugin/public/**/*.test.{ts,tsx}',
  ],
  coverageDirectory:
    '<rootDir>/plugins/security-dashboards-plugin/opensearch-dashboards-coverage/jest_ui',
  clearMocks: true,
  coverageReporters: ['lcov', 'text', 'cobertura', 'html'],
};
