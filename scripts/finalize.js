const fs = require('fs');
const BN = require('bn.js');
const generateUtils = require('./utils.js');

const Registry = artifacts.require('Registry');
const Access = artifacts.require('Access');
const Register = artifacts.require('Register');
const Transact = artifacts.require('Transact');
const Token = artifacts.require('Token');

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

module.exports = async done => {
  try {
    // Load ZOS ABI.
    const netId = process.env.NETWORK_ID;
    console.info(`Using network id ${netId}.`);
    const zosFile = `.openzeppelin/dev-${netId}.json`;
    const zosAbi = JSON.parse(fs.readFileSync(zosFile));
    console.info(`Loaded ZOS ABIs.`);

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

    console.info('Registering contracts with Registry...');

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
      console.info('Seeding data...');
      await seed({ utils, people, issuance, governance, token, transact });
    }

    console.info(`All done. Informations about network ${netId}:`);
    console.info(`  Registry is at ${registry.address}`);
    console.info(`  Register is at ${register.address}`);
    console.info(`  Access is at ${access.address}`);
    console.info(`  Transact is at ${transact.address}`);
    console.info(`  Token is at ${token.address}`);
  } catch (e) {
    console.info(e);
  }
  done();
};

const seed = async ({ utils, people, issuance, governance, token, transact }) => {
  console.info('This is not production - making a few staging actors and governors...');
  await Promise.all([
    utils.promoteActor(people.pierre_martin, governance),
    utils.promoteActor(people.kevin_monserrat, governance),
    utils.promoteGovernor(people.pierre_martin, governance)
  ]);

  const balance = await token.balanceOf(people.pk2m);
  console.info(`PK2M Balance: ${balance.toString()}.`);
  if (balance.eq(new BN(0))) {
    // This whole chink is about allocating for PK2M.
    const amount = '1_121_010'
    console.info(`Allocating tokens to ${people.pk2m} for Year 1 of operational costs.`);
    await utils.issue(amount, 'Operational costs for 2019', issuance);
    console.info(`  Now allocating tokens to PK2M...`);
    await token.allocate(people.pk2m, utils.convert(amount), governance);
    console.info('  Approving allocation transfer to PK2M...');
    const orderIdx = await transact.orderCount(ZERO_ADDRESS);
    const orderId = await transact.orderIdByOwnerAndIndex(ZERO_ADDRESS, orderIdx - 1);
    await transact.approve(orderId, governance);
    console.info(`  PK2M now has a balance of ${(await token.balanceOf(people.pk2m)).toString()} tokens.`)

    const transfer = async (from, to, amount, method) => {
      console.info(`Transfering from ${from} to ${to}.`);
      await token.transfer(to, utils.convert(amount), { from });
      if (!method) {
        return;
      }
      console.info(`Calling ${method} on transfer...`);
      const index = (await transact.orderCount(from)).sub(new BN(1));
      const orderId = await transact.orderIdByOwnerAndIndex(from, index);
      await transact[method](orderId, governance);
    };
    // Make some transfers...
    console.info("Performing a few transfers...")
    await transfer(people.pk2m, people.pierre_martin, '6050', 'approve');
    // Make 20 more fake transfers.
    for (let i = 1; i <= 20; ++i) {
      await transfer(people.pk2m, people.kevin_monserrat, `${i}0`);
    }
  }
};
