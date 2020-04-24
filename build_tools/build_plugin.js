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

const execa = require('execa');
const optimizer = require('@kbn/optimizer');
const dev_utils = require('@kbn/dev-utils');
const pluginConfig = require('@kbn/plugin-helpers/lib/plugin_config');
const path = require('path');
const vfs = require('vinyl-fs');
const rename = require('gulp-rename');
const rewritePackageJson = require('@kbn/plugin-helpers/tasks/build/rewrite_package_json');
const createPackage = require('@kbn/plugin-helpers/tasks/build/create_package');

async function build() {
  pluginRoot = process.cwd();

  console.log('Building plugin...');
  console.log(`CWD: ${pluginRoot}`);

  // clean up target dir
  console.log('Cleaning up target directory...');
  execa.sync('rm', ['-rf', 'target']);
  // transpile typescript code
  console.log('Transpiling typescript soruces...');
  const transpileResult = execa.sync('yarn', ['tsc']);
  if (transpileResult.exitCode !== 0) {
    console.log(`Failed to transpile the plugin\n
    stdout:\n${transpileResult.stdout}\n
    stderr:\n${transpileResult.stderr}`);
    process.exit(1);
  }
  console.log(transpileResult.stdout);

  // optimize browser application
  console.log('Exectuing optimizer...');
  try {
    await runOptimizer();
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
  // create plugin package
  console.log('Assembling plugin...')
  const plugin = pluginConfig(pluginRoot);
  createBuild(pluginRoot, plugin);

  const buildTarget = path.resolve(pluginRoot, 'build');
  const buildVersion = plugin.pkg.version;

  // create plugin zip file
  console.log('Creating plugin zip bundle...');
  try {
    await createPackage(plugin, buildTarget, buildVersion);
  } catch (error) {
    console.log(error);
    process.exit(1);
  };
  console.log(`BUILD SUCCESS`);
}

function runOptimizer() {
  const log = new dev_utils.ToolingLog({
    level: 'verbose',
    writeTo: process.stdout,
  });

  const pluignRoot = path.resolve(__dirname, '..');
  log.info(`Start running JS optimization for plugin at ${pluignRoot}`);

  const config = optimizer.OptimizerConfig.create({
    repoRoot: dev_utils.REPO_ROOT,
    watch: false,
    oss: true,
    dist: true,
    pluginPaths: [pluignRoot], // specify to build current plugin
    pluginScanDirs: [], // set pluginScanDirs to empty to skip building of other plugins
    cache: false,
  });

  return optimizer
    .runOptimizer(config)
    .pipe(optimizer.logOptimizerState(log, config))
    .toPromise();
}

function createBuild(pluginRoot, plugin) {
  const pluginId = plugin.id;
  const buildVersion = plugin.pkg.version;
  const kibanaVeersion = plugin.pkg.kibana.version;
  const buildTarget = path.resolve(pluginRoot, 'build');
  const buildRoot = path.join(buildTarget, 'kibana', pluginId);

  let nestFileInDir = (filePath) => {
    const nonRelativeDirname = filePath.dirname.replace(/^(\.\.\/?)+/g, '');
    filePath.dirname = path.join(path.relative(buildTarget, buildRoot), nonRelativeDirname);
  };

  // copy configuration files to build dir
  vfs
    .src(['kibana.json', 'package.json', 'LICENSE', 'NOTICE'], {
      cwd: pluginRoot,
      base: pluginRoot,
      allowEmpty: true,
    })
    .pipe(rewritePackageJson(pluginRoot, buildVersion, kibanaVeersion))
    .pipe(rename(nestFileInDir))
    .pipe(vfs.dest(buildTarget));
  
  // copy optimized browser application to build dir
  vfs
    .src(['target/public/**/*'], {
      cwd: pluginRoot,
      base: pluginRoot,
      allowEmpty: true,
    })
    .pipe(rename(nestFileInDir))
    .pipe(vfs.dest(buildTarget));
  
  // copy server plugin to build dir
  vfs
    .src(['**/*'], {
      cwd: path.join(pluginRoot, 'target', 'plugins', pluginId),
      base: path.join(pluginRoot, 'target', 'plugins', pluginId),
      allowEmpty: true,
    })
    .pipe(rename(nestFileInDir))
    .pipe(vfs.dest(buildTarget));
  console.log('Copied artifacts to build dir.');

  // install dependencies
  console.log('Installing dependencies');
  const installResult = execa.sync('yarn', ['install', '--production', '--pure-lockfile'], {
    cwd:buildRoot,
  });
  if (installResult.exitCode !== 0) {
    console.log(installResult.error);
    process.exit(1);
  }
  console.log(installResult.stdout);
}

// entry point
(async function() {
  try {
    await build();
  } catch (error) {
    console.log(error);
  }
})()
