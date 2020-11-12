#!/bin/sh
set -e

apk update
apk add bash g++ make python

# echo "Installing yarn..."
# npm install yarn -g

echo "Installing dependencies..."
yarn

echo "Building contracts..."
yarn pretest

echo "Testing and generating coverage..."
# yarn coverage
yarn test
