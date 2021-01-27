#!/bin/bash

rm -rf /tmp/yarn*

yarn ganache-cli \
  --host 127.0.0.1 \
  --port 7545 \
  --networkId 5777 \
  --chainId 5777 \
  --gasLimit 0x59A5380 \
  --gasPrice 1 \
  --defaultBalanceEther 10000 \
  --mnemonic "$MNEMONIC"
