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

const packageJson = require('../package.json');
const osdJson = require('../opensearch_dashboards.json');
const pluginName = 'security-dashboards';

const oldName = `build/${osdJson.id}-${osdJson.opensearchDashboardsVersion}.zip`;
const newName = `build/${pluginName}-${packageJson.version}.zip`;

console.log('rename ' + oldName + ' to ' + newName);

const fs = require('fs');
fs.renameSync(oldName, newName);
