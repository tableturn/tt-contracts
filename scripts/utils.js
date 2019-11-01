module.exports = (registry, access, register, transact, token) => {
  const convert = amount => {
    const clean = `${amount}`.split('_').join('');
    return `${clean}${'0'.repeat(6)}`;
  };

  const registerContract = async (name, addr, target, opts) => {
    if (addr !== target) {
      console.log(`  Setting ${name} into Registry to ${target}.`);
      await registry[`set${name}Contract`](target, opts);
    } else {
      console.log(`  Registry already has the right ${name} contract.`);
    }
  };

  const issue = async (amount, reason, issuance) => {
    console.log(`Issuing ${amount} tokens: ${reason}`);
    await token.issue(convert(amount), reason, issuance);
  };

  const promoteIssuer = async (address, opts = {}) => {
    if (await access.isIssuer(address)) {
      console.log(`  Address ${address} is already a governor, skipping...`);
      return;
    }
    console.log(` Making ${address} a governor.`);
    await access.addIssuer(address, opts);
  };

  const promoteGovernor = async (address, opts = {}) => {
    if (await access.isGovernor(address)) {
      console.log(`  Address ${address} is already a governor, skipping...`);
      return;
    }
    console.log(` Making ${address} a governor.`);
    await access.addGovernor(address, opts);
  };

  const promoteActor = async (address, opts = {}) => {
    if (await access.isActor(address)) {
      console.log(`  Address ${address} is already an actor, skipping...`);
      return;
    }
    console.log(`  Making ${address} an actor.`);
    await access.addActor(address, opts);
  };

  const promotePk2mInvestor = async (from, to, amount) => {
    await promoteActor(to, { from });
    console.log(`Transfering ${amount} to ${to}...`);
    await token.transfer(to, convert(`${amount}`), { from });
    const id = (await transact.countOrders(from)) - 1;
    console.log(`Approving transfer with id ${id}...`);
    await transact.approve(from, id, { from });
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

// utils.promotePk2mInvestor(people.pk2m, people.warwick_hill, 1000)
// utils.promotePk2mInvestor(people.pk2m, people.rhys_photis, 1000)
// utils.promotePk2mInvestor(people.pk2m, people.jimmy_bricknell, 100)
