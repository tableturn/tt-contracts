const fs = require('fs');
const BN = require('bn.js');

// Load contract classes.
const Registry = artifacts.require('Registry');
const Access = artifacts.require('Access');
const Register = artifacts.require('Register');
const Transact = artifacts.require('Transact');
const Token = artifacts.require('Token');

const convert = amount => {
  const clean = `${amount}`.split('_').join('');
  return `${clean}${'0'.repeat(6)}`;
};

module.exports = async done => {
  try {
    // Load ZOS ABI.
    const netId = await web3.eth.net.getId();
    console.log(`Using network id ${netId}.`);
    const zosFile = `.openzeppelin/dev-${netId}.json`;
    const zosAbi = JSON.parse(fs.readFileSync(zosFile));
    console.log(`Loaded ZOS ABIs.`);

    // Prepare some addresses.
    const { issuer, pk2m, pierre, kevin } = require(`../conf/people.${netId}`);
    const governance = { from: pk2m };
    const issuance = { from: issuer };
    // Load contracts.
    const registry = await Registry.at(zosAbi.proxies[`TTContracts/Registry`][0].address);
    const access = await Access.at(zosAbi.proxies[`TTContracts/Access`][0].address);
    const register = await Register.at(zosAbi.proxies[`TTContracts/Register`][0].address);
    const transact = await Transact.at(zosAbi.proxies[`TTContracts/Transact`][0].address);
    const token = await Token.at(zosAbi.proxies[`TTContracts/Token`][0].address);

    const registerContract = async (name, addr, target) => {
      if (addr !== target) {
        console.log(`  Setting ${name} into Registry to ${target}.`);
        await registry[`set${name}Contract`](target, governance);
      } else {
        console.log(`  Registry already has the right ${name} contract.`);
      }
    };

    console.log('Registering contracts with Registry...');

    await registerContract('Access', await registry.access(), access.address);
    await Promise.all([
      registerContract('Register', await registry.register(), register.address),
      registerContract('Transact', await registry.transact(), transact.address),
      registerContract('Token', await registry.token(), token.address)
    ]);

    await Promise.all([promoteActor(access, pk2m, pk2m), promoteIssuer(access, pk2m, issuer)]);

    if (netId !== 18021982) {
      console.log('This is not production - making a few staging actors and governors...');
      await Promise.all([
        promoteGovernor(access, pk2m, pierre),
        promoteActor(access, pk2m, pierre),
        promoteActor(access, pk2m, kevin)
      ]);

      const balance = await token.balanceOf(pk2m);
      console.log(`PK2M Balance: ${balance.toString()}.`);
      if (balance.eq(new BN(0))) {
        console.log(`Allocating tokens to ${pk2m} for Year 1 of operational costs.`);
        await issue(token, '38_140', 'Operational costs for 2019', issuance);
        await token.allocate(pk2m, convert('38_140'), governance);
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

const issue = async (token, amount, reason, issuance) => {
  console.log(`Issuing ${amount} tokens: ${reason}`);
  await token.issue(convert(amount), reason, issuance);
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
