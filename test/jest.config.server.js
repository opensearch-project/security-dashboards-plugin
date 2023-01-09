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
  roots: ['<rootDir>/plugins/security-dashboards-plugin'],
  testMatch: ['**/test/jest_integration/**/*.test.ts', '**/server/**/*.test.ts'],
  testPathIgnorePatterns: config.testPathIgnorePatterns.filter(
    (pattern) => !pattern.includes('integration_tests')
  ),
  setupFilesAfterEnv: [
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
