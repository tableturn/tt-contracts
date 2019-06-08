#!/bin/bash
set -e
dir=$(dirname "$0")
source $dir/_functions.sh

nextVersion=$(bump $version)
yarn zos bump $nextVersion --verbose

# Deploy logic contracts.
yarn zos update --all $zosArgs
