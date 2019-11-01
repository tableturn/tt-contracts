const Registry = artifacts.require('Registry');
const XferOrderLib = artifacts.require('XferOrderLib');
const XferGrantLib = artifacts.require('XferGrantLib');
const Transact = artifacts.require('Transact');

module.exports = async (deployer, net, accounts) => {
  const reg = await Registry.deployed();
  await deployer.link(XferOrderLib, Transact);
  await deployer.link(XferGrantLib, Transact);
  const transact = await deployer.deploy(Transact);
  await transact.initialize(reg.address);
  await reg.setTransactContract(transact.address, { from: accounts[3] });
};
