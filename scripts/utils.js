const BN = require('bn.js');

module.exports = (registry, access, register, transact, token) => {
  const convert = amount => {
    const clean = `${amount}`.split('_').join('');
    return `${clean}${'0'.repeat(6)}`;
  };

  const registerContract = async (name, addr, target, opts) => {
    if (addr !== target) {
      console.info(`  Setting ${name} into Registry to ${target}.`);
      await registry[`set${name}Contract`](target, opts);
    } else {
      console.warn(`  Registry already has the right ${name} contract.`);
    }
  };

  const issue = async (amount, reason, issuance) => {
    console.info(`Issuing ${amount} tokens: ${reason}`);
    await token.issue(convert(amount), reason, issuance);
  };

  const promoteIssuer = async (address, opts = {}) => {
    if (await access.isIssuer(address)) {
      console.warn(`  Address ${address} is already a governor, skipping...`);
      return;
    }
    console.info(` Making ${address} a governor.`);
    await access.addIssuer(address, opts);
  };

  const promoteGovernor = async (address, opts = {}) => {
    if (await access.isGovernor(address)) {
      console.warn(`  Address ${address} is already a governor, skipping...`);
      return;
    }
    console.info(` Making ${address} a governor.`);
    await access.addGovernor(address, opts);
  };

  const promoteActor = async (address, opts = {}) => {
    if (await access.isActor(address)) {
      console.warn(`  Address ${address} is already an actor, skipping...`);
      return;
    }
    console.info(`  Making ${address} an actor.`);
    await access.addActor(address, opts);
  };

  const promotePk2mInvestor = async (from, to, amount) => {
    await promoteActor(to, { from });
    console.info(`Transfering ${amount} to ${to}...`);
    await token.transfer(to, convert(`${amount}`), { from });
    const index = (await transact.countOrders(from)).sub(new BN(1));
    console.info(`Approving transfer with index ${index}...`);
    const orderId = await transact.orderIdAt(from, index);
    await transact.approve(orderId, { from });
  };

  const accountancy = async people => {
    return Object.keys(people).map(async k => [
      k,
      (await token.balanceOf(people[k])).toString().slice(0, -6)
    ]);
  };

  return {
    convert,
    issue,
    promoteActor,
    promotePk2mInvestor,
    promoteGovernor,
    promoteIssuer,
    registerContract,
    accountancy
  };
};
