const execa = require('execa');
const optimizer = require('@kbn/optimizer');
const dev_utils = require('@kbn/dev-utils');
const path = require('path');

async function build() {
  pluginRoot = process.cwd();

  console.log('Building plugin...');
  console.log(`CWD: ${pluginRoot}`);
  
  console.log('Cleaning up target directory...');
  execa.sync('rm', ['-rf', 'target']);
  console.log('Transpiling typescript soruces...');
  execa.sync('yarn', ['tsc']);
  console.log('Exectuing optimizer...')
  
  await runOptimizer();
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

build().then(() => {
  process.exit(0);
}).catch((error) => {
  process.exit(1);
});