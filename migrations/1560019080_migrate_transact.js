const Registry = artifacts.require('Registry');
const Transact = artifacts.require('Transact');

module.exports = async (deployer, net, accounts) => {
  const reg = await Registry.deployed();
  const transact = await deployer.deploy(Transact);
  await transact.initialize(reg.address);
  await reg.setTransactContract(transact.address, { from: accounts[3] });
};
