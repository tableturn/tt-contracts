#!/bin/bash
set -e
dir=$(dirname "$0")
source $dir/_functions.sh

nextVersion=$(bump $version)
yarn oz bump $nextVersion

# Deploy logic contracts.
yarn oz update --all $zosArgs
