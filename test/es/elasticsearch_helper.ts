/*
 *   Copyright 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
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

import * as fs from 'fs';
import * as path from 'path';
import * as childProcess from 'child_process';
import wreck from '@hapi/wreck';
import { sleep } from '../helper/sleep';
import { KIBANA_SERVER_USER, KIBANA_SERVER_PASSWORD } from '../constant';

const PLUGIN_ROOT_DIR = path.resolve(__dirname, '../..');
const ES_INSTALL_DIR = path.resolve(PLUGIN_ROOT_DIR, '.es');
let esRootDir: string;

export function downloadElasticsearch(esVersion: string): string {
  if (fs.existsSync(ES_INSTALL_DIR)) {
    childProcess.execSync(`rm -rf .es`, { cwd: PLUGIN_ROOT_DIR });
  }
  fs.mkdirSync(ES_INSTALL_DIR);

  console.log(`Downloading Elasticsearch...`);
  const esDownloadURL = `https://artifacts.elastic.co/downloads/elasticsearch/elasticsearch-oss-${esVersion}-darwin-x86_64.tar.gz`;
  // https://d3g5vo6xdbdb9a.cloudfront.net/tarball/opendistro-elasticsearch/opendistroforelasticsearch-1.9.0.tar.gz`;
  childProcess.execSync(`curl -o elasticsearch-oss-${esVersion}.tar.gz ${esDownloadURL}`, {
    cwd: ES_INSTALL_DIR,
  });
  childProcess.execSync(`tar -zxvf elasticsearch-oss-${esVersion}.tar.gz`, { cwd: ES_INSTALL_DIR });
  esRootDir = path.resolve(ES_INSTALL_DIR, `elasticsearch-${esVersion}`);
  return esRootDir;
}

export function installEsSecurityPlugin(pluginVersion: string) {
  const pluginDir = path.resolve(esRootDir, 'plugins');

  if (!fs.existsSync(pluginDir)) {
    fs.mkdirSync(pluginDir);
  }
  childProcess.execSync(
    `yes | bin/elasticsearch-plugin install https://d3g5vo6xdbdb9a.cloudfront.net/downloads/elasticsearch-plugins/opendistro-security/opendistro_security-${pluginVersion}.zip`,
    {
      cwd: path.resolve(esRootDir),
    }
  );
  const installDemoScript = path.resolve(
    pluginDir,
    'opendistro_security/tools/install_demo_configuration.sh'
  );
  childProcess.execSync(`chmod a+x ${installDemoScript}`, { cwd: pluginDir });
  childProcess.execSync(`yes | ${installDemoScript}`, { cwd: pluginDir });
}

export async function startElasticsearch() {
  // start ES process
  if (!esRootDir) {
    esRootDir = path.resolve(ES_INSTALL_DIR, 'elasticsearch-7.8.0');
    console.log(`Using esRootDir: ${esRootDir}`);
  }

  console.log(`Starting Elasticsearch...`);
  const esCmd = path.resolve(esRootDir, 'bin/elasticsearch');
  const esProcess = childProcess.exec(esCmd);
  console.log(`Elasticsearch pid: ${esProcess.pid}`);

  // ping ES to make sure ES is up
  let countdown = 30;
  let pingError;
  console.log(`Waiting for Elasticsearch to start`);
  const kbnServerCredentials = Buffer.from(`${KIBANA_SERVER_USER}:${KIBANA_SERVER_PASSWORD}`);
  while (countdown > 0) {
    countdown = countdown - 1;
    await sleep(5000);
    try {
      console.log('pinging ES');
      const response = await wreck.get('https://localhost:9200', {
        // agent: false,
        rejectUnauthorized: false,
        headers: {
          authorization: `Basic ${kbnServerCredentials.toString('base64')}`,
        },
      });
      if (
        response.res.statusCode &&
        response.res.statusCode >= 200 &&
        response.res.statusCode < 300
      ) {
        return esProcess;
      }
    } catch (error) {
      pingError = error;
    }
  }
  esProcess.kill('SIGINT');
  throw new Error(`Failed to launch Elasticsearch process. Error: ${pingError}`);
}

export async function stopElasticsearch(process: childProcess.ChildProcess) {
  console.log('Stopping Elasticsearch');
  process.kill('SIGTERM');
  let countdown = 5;
  while (countdown > 0) {
    countdown = countdown - 1;
    if (!process.killed) {
      await sleep(1000);
    } else {
      return;
    }
  }
  console.log(`Force killing Elasticsearch process`);
  process.kill('SIGINT');
}
