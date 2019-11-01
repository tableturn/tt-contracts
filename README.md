# TT Contracts

## Overview

First and foremost, always remember to `source .env` or any other appropriate environment file.

To bootstrap your development environment, either run the Ganache GUI or `yarn ganache`.

Then you can run `./scripts/bootstrap.sh`. It will deploy all contracts and create a bunch of upgradable instances.
It will also run [`yarn truffle exec scripts/finalize.js --network $NETWORK`](scripts/finalize.js) and credit 35m tokens to the 2nd account, as well as add a bunch of governors and actors.

To get all the required stuff available in the console, copy-paste the following snippet:

```code
// We will generate our utils later.
const generateUtils = require('./scripts/utils.js')
var utils;
// Load ZOS ABI.
const netId = process.env.NETWORK_ID
console.log(`Using network id ${netId}.`)
const zosFile = `.openzeppelin/dev-${netId}.json`
const zosAbi = JSON.parse(fs.readFileSync(zosFile))
console.log(`Loaded ZOS ABIs.`)
// Prepare some addresses.
const people = require(`../conf/people.${netId}`)
const governance = { from: people.pk2m }
const issuance = { from: people.issuer }
// Load contracts.
const registry = Registry.at(zosAbi.proxies[`TTContracts/Registry`][0].address)
const access = Access.at(zosAbi.proxies[`TTContracts/Access`][0].address)
const register = Register.at(zosAbi.proxies[`TTContracts/Register`][0].address)
const transact = Transact.at(zosAbi.proxies[`TTContracts/Transact`][0].address)
const token = Token.at(zosAbi.proxies[`TTContracts/Token`][0].address)
const contracts = [registry, access, register, transact, token];
Promise.all(contracts).then(() => { utils = generateUtils(registry, access, register, transact, token) })
```
