const AddressSetLib = artifacts.require('AddressSetLib');
const Access = artifacts.require('Access');

module.exports = async (deployer, net, accounts) => {
  await deployer.link(AddressSetLib, Access);
  const access = await deployer.deploy(Access);
  await access.initialize(accounts[3]);
};
