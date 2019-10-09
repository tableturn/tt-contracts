module.exports = (registry, access, register, transact, token) => {
  const convert = amount => {
    const clean = `${amount}`.split('_').join('');
    return `${clean}${'0'.repeat(6)}`;
  };

  const registerContract = async (name, addr, target, governance) => {
    if (addr !== target) {
      console.log(`  Setting ${name} into Registry to ${target}.`);
      await registry[`set${name}Contract`](target, governance);
    } else {
      console.log(`  Registry already has the right ${name} contract.`);
    }
  };

  const issue = async (amount, reason, issuance) => {
    console.log(`Issuing ${amount} tokens: ${reason}`);
    await token.issue(convert(amount), reason, issuance);
  };

  const promoteIssuer = async (governor, address) => {
    if (await access.isIssuer(address)) {
      console.log(`  Address ${address} is already a governor, skipping...`);
      return;
    }
    console.log(` Making ${address} a governor.`);
    await access.addIssuer(address, { from: governor });
  };

  const promoteGovernor = async (governor, address) => {
    if (await access.isGovernor(address)) {
      console.log(`  Address ${address} is already a governor, skipping...`);
      return;
    }
    console.log(` Making ${address} a governor.`);
    await access.addGovernor(address, { from: governor });
  };

  const promoteActor = async (governor, address) => {
    if (await access.isActor(address)) {
      console.log(`  Address ${address} is already an actor, skipping...`);
      return;
    }
    console.log(`  Making ${address} an actor.`);
    await access.addActor(address, { from: governor });
  };

  return {
    convert,
    issue,
    promoteActor,
    promoteGovernor,
    promoteIssuer,
    registerContract
  };
};
