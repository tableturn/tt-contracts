#!/bin/bash

sed -i \
  -e "s/BigNumber/BN/g" \
  -e "s/import { BN } from 'bignumber\.js';/import BN from 'bn\.js';/g" \
  "./types/truffle-contracts/index.d.ts"
