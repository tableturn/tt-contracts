const fs = require('fs');
const BN = require('bn.js');

// Load contract classes.
const Registry = artifacts.require('Registry');
const Access = artifacts.require('Access');
const Transact = artifacts.require('Transact');
const Token = artifacts.require('Token');

const convert = amount => {
  const clean = `${amount}`.split('_').join('');
  return `${clean}${'0'.repeat(18)}`;
};

module.exports = async done => {
  try {
    // Load ZOS ABI.
    const netId = await web3.eth.net.getId();
    console.log(`Using network id ${netId}.`);
    const zosFile = `zos.dev-${netId}.json`;
    const zosAbi = JSON.parse(fs.readFileSync(zosFile));
    console.log(`Loaded ZOS ABIs.`);
    // Get some useful things and functions.
    // Prepare some addresses.
    const { issuer, pk2m, pierre, kevin } = require(`../conf/people.${netId}`);
    const governance = { from: pk2m };
    const issuance = { from: issuer };
    // Load contracts.
    const registry = await Registry.at(zosAbi.proxies[`TTContracts/Registry`][0].address);
    const access = await Access.at(zosAbi.proxies[`TTContracts/Access`][0].address);
    const transact = await Transact.at(zosAbi.proxies[`TTContracts/Transact`][0].address);
    const token = await Token.at(zosAbi.proxies[`TTContracts/Token`][0].address);

    console.log('Registering contracts with Registry...');
    if ((await registry.access()) !== access.address) {
      console.log(`  Setting Access into Registry to ${access.address}.`);
      await registry.setAccessContract(access.address, governance);
    } else {
      console.log(`  Registry already has the right Access contract.`);
    }

    if ((await registry.transact()) !== transact.address) {
      console.log(`  Setting Transact into Registry to ${transact.address}.`);
      await registry.setTransactContract(transact.address, governance);
    } else {
      console.log(`  Registry already has the right Transact contract.`);
    }

    if ((await registry.token()) !== token.address) {
      console.log(`  Setting Token into Registry to ${token.address}.`);
      await registry.setTokenContract(token.address, governance);
    } else {
      console.log(`  Registry already has the right Token contract.`);
    }

    await promoteActor(access, pk2m, pk2m);

    if (netId !== 18021982) {
      console.log('This is not production - making a few staging actors and governors...');
      await Promise.all([
        promoteIssuer(access, pk2m, issuer),
        promoteGovernor(access, pk2m, pierre),
        promoteActor(access, pk2m, pierre),
        promoteActor(access, pk2m, kevin)
      ]);

      const balance = await token.balanceOf(pk2m);
      console.log(`PK2M Balance: ${balance.toString()}.`);
      if (balance.eq(new BN(0))) {
        const amount = convert('8_000_000');
        console.log(`Issuing 8m tokens to the reserve.`);
        await token.issue(amount, issuance);
        console.log(`Allocating the tokens to ${pk2m}.`);
        await token.allocate(pk2m, amount, governance);
      }
    }

    console.log(`All done. Informations about network ${netId}:`);
    console.log(`  Registry is at ${registry.address}`);
    console.log(`  Access is at ${access.address}`);
    console.log(`  Transact is at ${transact.address}`);
    console.log(`  Token is at ${token.address}`);
  } catch (e) {
    console.log(e);
  }
  done();
};

const promoteIssuer = async (access, governor, address) => {
  if (await access.isIssuer(address)) {
    console.log(`  Address ${address} is already a governor, skipping...`);
    return;
  }
  console.log(` Making ${address} a governor.`);
  await access.addIssuer(address, { from: governor });
};

const promoteGovernor = async (access, governor, address) => {
  if (await access.isGovernor(address)) {
    console.log(`  Address ${address} is already a governor, skipping...`);
    return;
  }
  console.log(` Making ${address} a governor.`);
  await access.addGovernor(address, { from: governor });
};

const promoteActor = async (access, governor, address) => {
  if (await access.isActor(address)) {
    console.log(`  Address ${address} is already an actor, skipping...`);
    return;
  }
  console.log(`  Making ${address} an actor.`);
  await access.addActor(address, { from: governor });
};
