#!/bin/bash
set -e
dir=$(dirname "$0")
source $dir/_functions.sh

# Compute new version.
nextVersion=$(bump $version)
# Bump version in the OZ project file.
yarn oz bump $nextVersion
