# TT Contracts

## Overview

First and foremost, always remember to `source .env` or any other appropriate environment file.

To bootstrap your development environment, either run the Ganache GUI or `yarn ganache`.

Then you can run `./scripts/bootstrap.sh`. It will deploy all contracts and create a bunch of upgradable instances.
It will also run [`yarn truffle exec scripts/finalize.js --network $NETWORK`](scripts/finalize.js) and credit 35m tokens to the 2nd account, as well as add a bunch of governors and actors.
