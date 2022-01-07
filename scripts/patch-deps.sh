#!/bin/bash

echo "TOOLING DEBUG: Current directory: $PWD"
if [[ $PWD == *"node_modules/tt-contracts"* ]]; then
  echo "TOOLING DEBUG: This script is being ran as part of a dependency."
  NODE_MODULES="$(pwd)/.."
else
  echo "TOOLING DEBUG: This script is being ran as part of the main project."
  NODE_MODULES="$(pwd)/node_modules"
fi

deps=("@openzeppelin/upgrades/contracts/Initializable.sol")

for dep in "${deps[@]}"; do
  echo "TOOLING DEBUG: Patching ${dep} ..."
  sed -i 's/^pragma solidity.*;/pragma solidity ^0.8.0;/' "${NODE_MODULES}/$dep"
done
