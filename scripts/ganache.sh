#!/bin/bash

rm -rf /tmp/yarn*

yarn ganache-cli \
  --host 127.0.0.1 \
  --port 7545 \
  -i 5777 \
  --gasLimit 0x59A5380 \
  --gasPrice 1 \
  --defaultBalanceEther 10000000000000 \
  --mnemonic "$MNEMONIC"
