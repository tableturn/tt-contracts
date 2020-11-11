# TT Contracts

[![codecov](https://codecov.io/gh/tableturn/tt-contracts/branch/master/graph/badge.svg?token=3qgwgCr9cg)](https://codecov.io/gh/tableturn/tt-contracts)
[![Build Status](https://ci.linky.one/api/badges/tableturn/tt-contracts/status.svg)](https://ci.linky.one/tableturn/tt-contracts)

## Overview

First and foremost, always remember to `source .env` or any other appropriate environment file.

To bootstrap your development environment, either run the Ganache GUI or `yarn ganache`.

Then you can run `./scripts/bootstrap.sh`. It will deploy all contracts and create a bunch of upgradable instances.
It will also run [`yarn truffle exec scripts/finalize.js --network $NETWORK`](scripts/finalize.js) and credit 35m tokens to the 2nd account, as well as add a bunch of governors and actors.

## Provisioning a Console

To get all the required stuff available in the console, copy-paste the following snippet:

```code
const BN = require('bn.js');
const generateUtils = require('./scripts/utils.js')
const netId = process.env.NETWORK_ID
const zosFile = `.openzeppelin/dev-${netId}.json`
const zosAbi = JSON.parse(fs.readFileSync(zosFile))
const people = Object.assign(require(`./conf/addresses.${netId}`), require(`./conf/addresses.private.${netId}`))
const governance = { from: people.pk2m }
const issuance = { from: people.issuer }
const registry = await Registry.at(zosAbi.proxies[`TTContracts/Registry`][0].address)
const access = await Access.at(zosAbi.proxies[`TTContracts/Access`][0].address)
const register = await Register.at(zosAbi.proxies[`TTContracts/Register`][0].address)
const transact = await Transact.at(zosAbi.proxies[`TTContracts/Transact`][0].address)
const token = await Token.at(zosAbi.proxies[`TTContracts/Token`][0].address)
```

Once done and after all promises are fullfilled, simply run this line:

```code
const utils = generateUtils(registry, access, register, transact, token)
```

You should now be able to issue transactions. For example, to initiate a transfer of 20 CVDS from PK2M to someone, you can:

```code
token.transfer(people.pierre_martin, utils.convert('20'), { from: people.pk2m })
```

Once this is done and the transaction yields a receipt, you can inspect how many pending transfer orders exist for PK2M:

```code
const count = await transact.countOrders(people.pk2m)
```

At this point, `count` will be a `BigNumber` and you can infer what transfer is the one that needs approval. For example, if `count` came back equal to `3`, then the latest transfer has an identifier of `2`. To approve it, you can run:

```code
transact.approve(people.pk2m, count.sub(new BN(1)), { from: people.pk2m })
```
