/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/* eslint-disable import/no-unresolved */
const cypressPlugin = require('eslint-plugin-cypress');
const unusedImportsPlugin = require('eslint-plugin-unused-imports');

const osdConfig = require('@elastic/eslint-config-kibana');
const { eui } = require('@elastic/eslint-config-kibana/extras');

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
`;

module.exports = [
  // Replaces .eslintignore (ESLint 10 no longer reads it). `eslint.config.js`
  // is the flat config itself and is not part of the linted source.
  {
    ignores: [
      'node_modules',
      'data',
      'optimize',
      'build',
      'target',
      'cypress.config.js',
      'eslint.config.js',
    ],
  },
  ...osdConfig,
  ...eui,
  {
    // cypress and unused-imports are not registered by the shared config, so
    // register them here. unused-imports is a plugin-level devDependency.
    plugins: {
      cypress: cypressPlugin,
      'unused-imports': unusedImportsPlugin,
    },
    languageOptions: {
      globals: {
        ...cypressPlugin.configs.globals.languageOptions.globals,
      },
    },
    rules: {
      '@osd/eslint/no-restricted-paths': [
        'error',
        {
          basePath: __dirname,
          zones: [
            {
              target: ['(public|server)/**/*'],
              from: ['../../packages/**/*', 'packages/**/*'],
            },
          ],
        },
      ],
      // Cypress specific rules
      'cypress/no-assigning-return-values': 'error',
      'cypress/no-unnecessary-waiting': 'error',
      'cypress/assertion-before-screenshot': 'warn',
      'cypress/no-force': 'warn',
      'cypress/no-async-tests': 'error',
      // Unused imports and variables rules
      'no-unused-vars': 'off',
      'unused-imports/no-unused-imports': 'error',
    },
  },
  {
    files: ['**/*.{js,ts,tsx}'],
    rules: {
      '@osd/eslint/require-license-header': ['error', { licenses: [LICENSE_HEADER] }],
      'no-console': 0,
    },
  },
  {
    // Jest setup files run in Node and reference the `global` object.
    files: ['test/**/*.{js,ts}'],
    languageOptions: {
      globals: {
        global: 'readonly',
      },
    },
  },
];
