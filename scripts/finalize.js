const fs = require('fs');
const BN = require('bn.js');
const generateUtils = require('./utils.js');

const Registry = artifacts.require('Registry');
const Access = artifacts.require('Access');
const Register = artifacts.require('Register');
const Transact = artifacts.require('Transact');
const Token = artifacts.require('Token');

module.exports = async done => {
  try {
    // Load ZOS ABI.
    const netId = process.env.NETWORK_ID;
    console.log(`Using network id ${netId}.`);
    const zosFile = `.openzeppelin/dev-${netId}.json`;
    const zosAbi = JSON.parse(fs.readFileSync(zosFile));
    console.log(`Loaded ZOS ABIs.`);

    // Prepare some addresses.
    const people = Object.assign(
      require(`../conf/addresses.${netId}`),
      require(`../conf/addresses.private.${netId}`)
    );
    const governance = { from: people.pk2m };
    const issuance = { from: people.issuer };
    // Load contracts.
    const registry = await Registry.at(zosAbi.proxies[`TTContracts/Registry`][0].address);
    const access = await Access.at(zosAbi.proxies[`TTContracts/Access`][0].address);
    const register = await Register.at(zosAbi.proxies[`TTContracts/Register`][0].address);
    const transact = await Transact.at(zosAbi.proxies[`TTContracts/Transact`][0].address);
    const token = await Token.at(zosAbi.proxies[`TTContracts/Token`][0].address);
    // Pause here until all awaits are fullfilled...
    const utils = generateUtils(registry, access, register, transact, token);

    console.log('Registering contracts with Registry...');

    await utils.registerContract('Access', await registry.access(), access.address, governance);
    await Promise.all([
      utils.registerContract('Register', await registry.register(), register.address, governance),
      utils.registerContract('Transact', await registry.transact(), transact.address, governance),
      utils.registerContract('Token', await registry.token(), token.address, governance)
    ]);

    await Promise.all([
      utils.promoteActor(people.pk2m, governance),
      utils.promoteIssuer(people.issuer, governance)
    ]);

    if (netId !== 18021982) {
      console.log('This is not production - making a few staging actors and governors...');
      await Promise.all([
        utils.promoteActor(people.pierre_martin, governance),
        utils.promoteActor(people.kevin_monserrat, governance),
        utils.promoteGovernor(people.pierre_martin, governance)
      ]);

      const balance = await token.balanceOf(people.pk2m);
      console.log(`PK2M Balance: ${balance.toString()}.`);
      if (balance.eq(new BN(0))) {
        console.log(`Allocating tokens to ${people.pk2m} for Year 1 of operational costs.`);
        await utils.issue('1_121_010', 'Operational costs for 2019', issuance);
        await token.allocate(people.pk2m, utils.convert('1_121_010'), governance);

        console.log(`Transfering tokens from ${people.pk2m} to an actor account.`);
        await token.transfer(people.kevin_monserrat, utils.convert('6050'), { from: people.pk2m });
        console.log(`Approving transfer...`);
        await transact.approve(people.pk2m, 0, { from: people.pk2m });
      }
    }

    console.log(`All done. Informations about network ${netId}:`);
    console.log(`  Registry is at ${registry.address}`);
    console.log(`  Register is at ${register.address}`);
    console.log(`  Access is at ${access.address}`);
    console.log(`  Transact is at ${transact.address}`);
    console.log(`  Token is at ${token.address}`);
  } catch (e) {
    console.log(e);
  }
  done();
};
