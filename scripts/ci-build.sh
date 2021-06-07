#!/bin/sh
set -e

apk update
apk add bash g++ make python

echo "Installing dependencies..."
yarn

echo "Building contracts..."
yarn pretest

echo "Starting local chain..."
./scripts/ganache.sh > /dev/null &
echo "Running tests..."
yarn test

echo "Testing and generating coverage..."
# yarn coverage
yarn test
