/*
 * Copyright 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
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
  roots: ['<rootDir>/plugins/opendistro_security'],
  testMatch: ['**/public/**/*.test.{ts,tsx,js,jsx}', '**/common/*.test.{ts, tsx}'],
  testPathIgnorePatterns: [
    '<rootDir>/plugins/opendistro_security/build/',
    '<rootDir>/plugins/opendistro_security/node_modules/',
  ],
  setupFilesAfterEnv: ['<rootDir>/src/dev/jest/setup/after_env.integration.js'],
  collectCoverageFrom: [
    '<rootDir>/plugins/opendistro_security/public/**/*.{ts,tsx}',
    '!<rootDir>/plugins/opendistro_security/public/**/*.test.{ts,tsx}',
  ],
  coverageDirectory: '<rootDir>/plugins/opendistro_security/kibana-coverage/jest_ui',
  clearMocks: true,
  coverageReporters: ['lcov', 'text', 'cobertura', 'html'],
};
