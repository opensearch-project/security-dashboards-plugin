#!/bin/bash
set -e
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd $DIR
find . -name '.DS_Store' -type f -delete
rm -rf ./target
rm -rf ./releases
rm -rf ./node_modules
rm -rf ./build
rm -rf ./plugins
rm -f *.log
