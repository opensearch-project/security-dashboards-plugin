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
    // Under Jest 30's stricter package "exports" resolution, `import ... from 'jose'` resolves
    // to jose's pure-ESM `browser` build (dist/browser/index.js), which Jest can't parse
    // ("Unexpected token 'export'"). Pin it to the CommonJS build the `require` condition uses.
    '^jose$':
      '<rootDir>/plugins/security-dashboards-plugin/node_modules/jose/dist/node/cjs/index.js',
  },
  roots: ['<rootDir>/plugins/security-dashboards-plugin'],
  testMatch: ['**/test/jest_integration/**/*.test.ts', '**/server/**/*.test.ts'],
  testPathIgnorePatterns: config.testPathIgnorePatterns.filter(
    (pattern) => !pattern.includes('integration_tests')
  ),
  // Preserve the base setupFilesAfterEnv chain (jest-location-mock is a harmless
  // no-op in node env; mocks.js guards its window-dependent mocks), then keep the
  // plugin-specific integration timeout and TextEncoder/TextDecoder polyfill.
  setupFilesAfterEnv: [
    ...config.setupFilesAfterEnv,
    '<rootDir>/src/dev/jest/setup/after_env.integration.js',
    '<rootDir>/plugins/security-dashboards-plugin/test/setup/after_env.js',
  ],
  collectCoverageFrom: [
    '<rootDir>/plugins/security-dashboards-plugin/server/**/*.{ts,tsx}',
    '!<rootDir>/plugins/security-dashboards-plugin/server/**/*.test.{ts,tsx}',
    '!<rootDir>/plugins/security-dashboards-plugin/server/auth/types/jwt/**/*.{ts,tsx}',
    '!<rootDir>/plugins/security-dashboards-plugin/server/auth/types/openid/**/*.{ts,tsx}',
    '!<rootDir>/plugins/security-dashboards-plugin/server/auth/types/saml/**/*.{ts,tsx}',
    '!<rootDir>/plugins/security-dashboards-plugin/server/auth/types/proxy/**/*.{ts,tsx}',
  ],
  coverageDirectory:
    '<rootDir>/plugins/security-dashboards-plugin/opensearch-dashboards-coverage/jest_server',
  coverageReporters: ['lcov', 'text', 'cobertura', 'html'],
};
