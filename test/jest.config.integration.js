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
  testMatch: ['**/test/jest_integration/**/*.test.ts'],
  testPathIgnorePatterns: config.testPathIgnorePatterns.filter(
    (pattern) => !pattern.includes('integration_tests')
  ),
  reporters: [
    'default',
    ['<rootDir>/src/dev/jest/junit_reporter.js', { reportName: 'Jest Integration Tests' }],
  ],
  setupFilesAfterEnv: [
    '<rootDir>/src/dev/jest/setup/after_env.integration.js',
    '<rootDir>/plugins/opendistro_security/test/es/setup_es.js',
  ],
};
