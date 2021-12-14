#!/bin/bash

NODE_MODULES="$(pwd)/.."
deps=("@openzeppelin/contracts-ethereum-package/contracts/token/ERC20/IERC20.sol" "@openzeppelin/upgrades/contracts/Initializable.sol")

for dep in "${deps[@]}"; do
  echo "Patching ${dep} ..."
  sed -i 's/^pragma solidity.*;/pragma solidity ^0.8.0;/' "${NODE_MODULES}/$dep"
done
