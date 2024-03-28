const LICENSE_HEADER = `
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
`

module.exports = {
  root: true,
  extends: ['@elastic/eslint-config-kibana', 'plugin:@elastic/eui/recommended'],
  env: {
    'cypress/globals': true,
  },
  plugins: [
    'cypress',
    "unused-imports"
  ],
  rules: {
    // "@osd/eslint/require-license-header": "off"
    '@osd/eslint/no-restricted-paths': [
      'error',
      {
        basePath: __dirname,
        zones: [
          {
            target: ['(public|server)/**/*'],
            from: ['../../packages/**/*','packages/**/*'],
          },
        ],
      },
    ],
    // Add cypress specific rules here
    'cypress/no-assigning-return-values': 'error',
    'cypress/no-unnecessary-waiting': 'error',
    'cypress/assertion-before-screenshot': 'warn',
    'cypress/no-force': 'warn',
    'cypress/no-async-tests': 'error',
    // Unused imports and variables rules
    "no-unused-vars": "off",
    "unused-imports/no-unused-imports": "error",
  },
  overrides: [
    {
      files: ['**/*.{js,ts,tsx}'],
      rules: {
        '@osd/eslint/require-license-header': [
          'error',
          {
            licenses: [ LICENSE_HEADER ],
          },
        ],
        'no-console': 0,
      },
    },
  ],
};
