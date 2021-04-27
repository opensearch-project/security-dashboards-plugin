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

import { existsSync, mkdirSync } from 'fs';
import { resolve } from 'path';
import { ChildProcess, exec, execSync } from 'child_process';
import wreck from '@hapi/wreck';
import { sleep } from '../helper/sleep';
import {
  OPENSEARCH_DASHBOARDS_SERVER_USER,
  OPENSEARCH_DASHBOARDS_SERVER_PASSWORD,
  ELASTICSEARCH_VERSION,
  SECURITY_ES_PLUGIN_VERSION,
} from '../constant';

const PLUGIN_ROOT_DIR = resolve(__dirname, '../..');
const ES_INSTALL_DIR = resolve(PLUGIN_ROOT_DIR, '.es');
let esRootDir: string;

export function downloadElasticsearch(): string {
  if (existsSync(ES_INSTALL_DIR)) {
    execSync('rm -rf .es', { cwd: PLUGIN_ROOT_DIR });
  }
  mkdirSync(ES_INSTALL_DIR);

  console.log('Downloading Elasticsearch...');
  const esDownloadURL = `https://artifacts.elastic.co/downloads/elasticsearch/elasticsearch-oss-${ELASTICSEARCH_VERSION}-darwin-x86_64.tar.gz`;
  execSync(`curl -o elasticsearch-oss-${ELASTICSEARCH_VERSION}.tar.gz ${esDownloadURL}`, {
    cwd: ES_INSTALL_DIR,
  });
  execSync(`tar -zxvf elasticsearch-oss-${ELASTICSEARCH_VERSION}.tar.gz`, {
    cwd: ES_INSTALL_DIR,
  });
  esRootDir = resolve(ES_INSTALL_DIR, `elasticsearch-${ELASTICSEARCH_VERSION}`);
  return esRootDir;
}

export function installEsSecurityPlugin() {
  const pluginDir = resolve(esRootDir, 'plugins');

  if (!existsSync(pluginDir)) {
    mkdirSync(pluginDir);
  }
  execSync(
    `yes | bin/elasticsearch-plugin install https://d3g5vo6xdbdb9a.cloudfront.net/downloads/elasticsearch-plugins/opendistro-security/opendistro_security-${SECURITY_ES_PLUGIN_VERSION}.zip`,
    {
      cwd: resolve(esRootDir),
    }
  );
  const installDemoScript = resolve(
    pluginDir,
    'opendistro_security/tools/install_demo_configuration.sh'
  );

  execSync(`chmod a+x ${installDemoScript}`, { cwd: esRootDir });
  execSync(`yes | ${installDemoScript}`, { cwd: esRootDir });

  // allow updating ES security plugin auth configs via API
  execSync(
    `echo 'opendistro_security.unsupported.restapi.allow_securityconfig_modification: true' >> config/elasticsearch.yml`,
    { cwd: esRootDir }
  );
}

export async function startElasticsearch() {
  // start ES process
  if (!esRootDir) {
    esRootDir = resolve(ES_INSTALL_DIR, `elasticsearch-${ELASTICSEARCH_VERSION}`);
    console.log(`Using esRootDir: ${esRootDir}`);
  }

  console.log('Starting Elasticsearch...');
  const esCmd = resolve(esRootDir, 'bin/elasticsearch');
  const esProcess = exec(esCmd);
  console.log(`Elasticsearch pid: ${esProcess.pid}`);

  // ping ES to make sure ES is up
  let countdown = 30;
  let pingError;
  console.log('Waiting for Elasticsearch to start...');
  const osdServerCredentials = Buffer.from(
    `${OPENSEARCH_DASHBOARDS_SERVER_USER}:${OPENSEARCH_DASHBOARDS_SERVER_PASSWORD}`
  );
  while (countdown > 0) {
    countdown = countdown - 1;
    await sleep(5000);
    try {
      console.log('pinging ES');
      const response = await wreck.get('https://localhost:9200', {
        rejectUnauthorized: false,
        headers: {
          authorization: `Basic ${osdServerCredentials.toString('base64')}`,
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

export async function stopElasticsearch(process: ChildProcess) {
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
  console.log('Force killing Elasticsearch process');
  process.kill('SIGINT');
}
