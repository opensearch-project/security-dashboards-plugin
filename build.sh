#!/bin/bash
KIBANA_VERSION="$1"
ELASTICSEARCH_SECURITY_PLUGIN_VERSION="$2"
COMMAND="$3"

# sanity checks for options
if [ -z "$KIBANA_VERSION" ] || [ -z "$ELASTICSEARCH_SECURITY_PLUGIN_VERSION" ] || [ -z "$COMMAND" ]; then
    echo "Usage: ./build.sh <kibana_version> <elasticsearch_security_plugin_version> <install|deploy>"
    exit 1;
fi

if [ "$COMMAND" != "deploy" ] && [ "$COMMAND" != "deploy-snapshot" ] && [ "$COMMAND" != "install" ]; then
    echo "Usage: ./build.sh <kibana_version> <elasticsearch_security_plugin_version> <install|deploy>"
    echo "Unknown command: $COMMAND"
    exit 1;
fi

# sanity checks for maven
if [ -z "$MAVEN_HOME" ]; then
    echo "MAVEN_HOME not set"
    exit 1;
fi

echo "+++ Checking Maven version +++"
$MAVEN_HOME/bin/mvn -version
if [ $? != 0 ]; then
    echo "Checking maven version failed";
    exit 1;
fi

# sanity checks for nvm
if [ -z "$NVM_HOME" ]; then
    echo "NVM_HOME not set"
    exit 1;
fi

echo "+++ Sourcing nvm +++"
[ -s "$NVM_HOME/nvm.sh" ] && \. "$NVM_HOME/nvm.sh"

echo "+++ Checking nvm version +++"
nvm version
if [ $? != 0 ]; then
    echo "Checking mvn version failed";
    exit 1;
fi

# check version matches. Do not use jq here, only bash
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd $DIR
# while read -r line
# do
#     if [[ "$line" =~ ^\"version\".* ]]; then
#       if [[ "$line" != "\"version\": \"$1-$2\"," ]]; then
#         echo "Provided version \"version\": \"$1-$2\" does not match Kibana version: $line"
#         exit 1;
#       fi
#     fi
# done < "package.json"

# cleanup any leftovers
./clean.sh
if [ $? != 0 ]; then
    echo "Cleaning leftovers failed";
    exit 1;
fi

# prepare artefacts
PLUGIN_NAME="opendistro_security_kibana_plugin-$ELASTICSEARCH_SECURITY_PLUGIN_VERSION"
echo "+++ Building $PLUGIN_NAME.zip +++"

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$DIR"
mkdir -p build_stage
cd build_stage

echo "+++ Cloning https://github.com/elastic/kibana.git +++"
git clone https://github.com/elastic/kibana.git || true > /dev/null 2>&1
if [ $? != 0 ]; then
    echo "got clone Kibana repository failed";
    exit 1;
fi

cd "kibana"
git fetch

echo "+++ Change to tags/v$KIBANA_VERSION +++"
git checkout "tags/v$KIBANA_VERSION"

if [ $? != 0 ]; then
    echo "Switching to Kibana tags/v$KIBANA_VERSION failed";
    exit 1;
fi

echo "+++ Installing node version $(cat .node-version) +++"
nvm install "$(cat .node-version)"
if [ $? != 0 ]; then
    echo "Installing node $(cat .node-version) failed";
    exit 1;
fi


cd "$DIR"
rm -rf build/
rm -rf node_modules/

echo "+++ Installing node modules +++"
npm install
if [ $? != 0 ]; then
    echo "Installing node modules failed";
    exit 1;
fi


echo "+++ Copy plugin contents +++"
COPYPATH="build/kibana/$PLUGIN_NAME"
mkdir -p "$COPYPATH"
cp -a "$DIR/index.js" "$COPYPATH"
cp -a "$DIR/package.json" "$COPYPATH"
cp -a "$DIR/lib" "$COPYPATH"
cp -a "$DIR/node_modules" "$COPYPATH"
cp -a "$DIR/public" "$COPYPATH"

# Replace pom version
rm -f pom.xml

sed -e "s/RPLC_PLUGIN_VERSION/$KIBANA_VERSION-$SG_PLUGIN_VERSION/" ./pom.template.xml > ./pom.xml
if [ $? != 0 ]; then
    echo "sed failed";
    exit 1;
fi

if [ "$COMMAND" = "deploy" ] ; then
    echo "+++ mvn clean deploy -Prelease +++"
    $MAVEN_HOME/bin/mvn clean deploy -Prelease
    if [ $? != 0 ]; then
        echo "$MAVEN_HOME/bin/mvn clean deploy -Prelease failed";
        exit 1;
    fi
fi

#-s settings.xml is needed on circleci only
if [ "$COMMAND" = "deploy-snapshot" ] ; then
    echo "+++ mvn clean deploy +++"
    $MAVEN_HOME/bin/mvn clean deploy -s settings.xml
    if [ $? != 0 ]; then
        echo "$MAVEN_HOME/bin/mvn clean deploy -s settings.xml failed";
        exit 1;
    fi
fi

if [ "$COMMAND" = "install" ] ; then
    echo "+++ mvn clean install +++"
    $MAVEN_HOME/bin/mvn clean install
    if [ $? != 0 ]; then
        echo "$MAVEN_HOME/bin/mvn clean install failed";
        exit 1;
    fi
fi
