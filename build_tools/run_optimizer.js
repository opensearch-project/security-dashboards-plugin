'use strict';
const optimizer = require('@kbn/optimizer');
const dev_utils = require('@kbn/dev-utils');
const path = require('path');

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

optimizer
  .runOptimizer(config)
  .pipe(optimizer.logOptimizerState(log, config))
  .toPromise()
  .then(function(value) {
    log.info('Plugin built successfully.');
    process.exit(0);
  })
  .catch(function(error) {
    log.error('Plugin build failed.');
    log.error(error);
    process.exit(1);
  });

async function runOptimizer() {
  return Promise.resolve(optimizer
    .runOptimizer(config)
    .pipe(optimizer.logOptimizerState(log, config))
    .toPromise());
};

exports.runOptimizer = runOptimizer;
