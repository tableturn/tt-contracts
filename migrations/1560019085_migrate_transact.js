const Registry = artifacts.require('Registry');
const XferOrderLib = artifacts.require('XferOrderLib');
const XferGrantLib = artifacts.require('XferGrantLib');
const Transact = artifacts.require('Transact');

module.exports = async (deployer, net, accounts) => {
  const reg = await Registry.deployed();
  await Promise.all([XferOrderLib, XferGrantLib].map(lib => deployer.link(lib, Transact)));
  const transact = await deployer.deploy(Transact);
  await transact.initialize(reg.address);
  await reg.setTransactContract(transact.address, { from: accounts[3] });
};
