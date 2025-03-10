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
  roots: ['<rootDir>/plugins/wazuh-security-dashboards-plugin'],
  testMatch: ['**/public/**/*.test.{ts,tsx,js,jsx}', '**/common/*.test.{ts, tsx}'],
  testPathIgnorePatterns: [
    '<rootDir>/plugins/wazuh-security-dashboards-plugin/build/',
    '<rootDir>/plugins/wazuh-security-dashboards-plugin/node_modules/',
  ],
  setupFilesAfterEnv: ['<rootDir>/src/dev/jest/setup/after_env.integration.js'],
  collectCoverageFrom: [
    '<rootDir>/plugins/wazuh-security-dashboards-plugin/public/**/*.{ts,tsx}',
    '!<rootDir>/plugins/wazuh-security-dashboards-plugin/public/**/*.test.{ts,tsx}',
  ],
  coverageDirectory:
    '<rootDir>/plugins/wazuh-security-dashboards-plugin/opensearch-dashboards-coverage/jest_ui',
  clearMocks: true,
  coverageReporters: ['lcov', 'text', 'cobertura', 'html'],
};
