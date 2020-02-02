#!/bin/bash

if ! [ -x "$(command -v jq)" ]; then
  echo 'Error: jq is not installed. jq is required for parsing package.json'
  exit 1
fi

KIBANA_VERSION=$(cat package.json | jq -r ".kibana.version")
echo "+++ Building for kibana version $KIBANA_VERSION +++"

# sanity checks for nvm
if [ -z "$NVM_HOME" ]; then
    echo "NVM_HOME not set"
    exit 1
fi

echo "+++ Sourcing nvm +++"
[ -s "$NVM_HOME/nvm.sh" ] && \. "$NVM_HOME/nvm.sh"

echo "+++ Checking nvm version +++"
nvm version
if [ $? != 0 ]; then
    echo "Checking mvn version failed"
    exit 1
fi

# check version matches. Do not use jq here, only bash
WORK_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd $WORK_DIR

# cleanup any leftovers
./clean.sh
if [ $? != 0 ]; then
    echo "Cleaning leftovers failed"
    exit 1
fi

# prepare artifacts
echo "+++ Preparing artifacts for building plugin +++"

WORK_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$WORK_DIR"
BUILD_STAGE_DIR="$WORK_DIR/build_stage"
mkdir -p $BUILD_STAGE_DIR
cd $BUILD_STAGE_DIR

echo "+++ Cloning https://github.com/elastic/kibana.git +++"
git clone https://github.com/elastic/kibana.git || true > /dev/null 2>&1
if [ $? != 0 ]; then
    echo "git clone Kibana repository failed"
    exit 1
fi

cd "kibana"
git fetch

echo "+++ Change to tags/v$KIBANA_VERSION +++"
git checkout "tags/v$KIBANA_VERSION"

if [ $? != 0 ]; then
    echo "Switching to Kibana tags/v$KIBANA_VERSION failed"
    exit 1
fi

echo "+++ Installing node version $(cat .node-version) +++"
nvm install "$(cat .node-version)"
if [ $? != 0 ]; then
    echo "Installing node $(cat .node-version) failed"
    exit 1
fi

echo "+++ Installing Yarn +++"
curl -o- -L https://yarnpkg.com/install.sh | bash
if [ $? != 0 ]; then
    echo "Installing Yarn failed"
    exit 1
fi

echo "+++ Sourcing Yarn +++"
export PATH="$HOME/.yarn/bin:$HOME/.config/yarn/global/node_modules/.bin:$PATH"

echo "+++ Copy plugin contents to build stage +++"
BUILD_STAGE_PLUGIN_DIR="$BUILD_STAGE_DIR/kibana/plugins/security-kibana-plugin"
mkdir -p $BUILD_STAGE_PLUGIN_DIR
cp -a "$WORK_DIR/index.js" "$BUILD_STAGE_PLUGIN_DIR"
cp -a "$WORK_DIR/package.json" "$BUILD_STAGE_PLUGIN_DIR"
cp -a "$WORK_DIR/lib" "$BUILD_STAGE_PLUGIN_DIR"
cp -a "$WORK_DIR/public" "$BUILD_STAGE_PLUGIN_DIR"
cp -a "$WORK_DIR/tests" "$BUILD_STAGE_PLUGIN_DIR"
cp -a "$WORK_DIR/babel.config.js" "$BUILD_STAGE_PLUGIN_DIR"

cd $BUILD_STAGE_PLUGIN_DIR

echo "+++ Checking yarn packages for vulnerabilities +++"
auditResult=`yarn audit --level 4`
isNoVulnerability="[^\d]0 vulnerabilities found.*$"
let limit=1*10**20 # Limit num of chars because the result can be huge
if [[ ! $auditResult =~ $isNoVulnerability && $EXIT_IF_VULNERABILITY = true ]]; then
    echo ${auditResult::limit}
    exit 1
fi
echo ${auditResult::limit}

echo "+++ Installing plugin node modules +++"
yarn kbn bootstrap
if [ $? != 0 ]; then
    echo "Installing node modules failed"
    exit 1
fi

echo "+++ Building plugin +++"
yarn build
if [ $? != 0 ]; then
    echo "Installing node modules failed"
    exit 1
fi

cd "$WORK_DIR"
PLUGINS_OUTPUT_DIR="$WORK_DIR/plugins"
mkdir -p $PLUGINS_OUTPUT_DIR
cp $BUILD_STAGE_PLUGIN_DIR/build/*.zip $PLUGINS_OUTPUT_DIR/

echo "Plugin artifacts: $(find "$(cd $PLUGINS_OUTPUT_DIR; pwd)" -name '*.zip')"
