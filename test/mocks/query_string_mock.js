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

/**
 * Plugin-local variant of src/dev/jest/mocks/query_string_mock.js.
 *
 * The shared base mock resolves query-string via `process.cwd()`, assuming cwd is
 * the OpenSearch Dashboards repo root. This plugin runs Jest through its own runner
 * (test/run_jest_tests.js), which leaves process.cwd() pointing at the plugin
 * directory (which has no node_modules/query-string). Resolve the package relative
 * to this file instead so it works regardless of cwd.
 */

const path = require('path');

// This file lives at <repoRoot>/plugins/security-dashboards-plugin/test/mocks/.
// Walk back up to the repo root to reach the hoisted node_modules/query-string.
const repoRoot = path.resolve(__dirname, '../../../..');

// eslint-disable-next-line import/no-dynamic-require
const mod = require(path.resolve(repoRoot, 'node_modules/query-string/index.js'));

const api = mod && mod.__esModule && typeof mod.stringify !== 'function' ? mod.default : mod;

module.exports = {
  __esModule: true,
  default: api,
};
