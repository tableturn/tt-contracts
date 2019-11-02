#!/bin/sh
set -e

apk update
apk add bash g++ make python

echo "Installing yarn..."
npm install yarn -g

echo "Installing dependencies..."
yarn

echo "Starting local chain..."
# ./scripts/ganache.sh > /dev/null &

echo "Building contracts..."
yarn pretest
# echo "Running tests..."
# yarn test
echo "Testing and generating coverage..."
yarn coverage
