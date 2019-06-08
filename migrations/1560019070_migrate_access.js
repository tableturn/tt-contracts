const AddressSet = artifacts.require('AddressSet');
const Access = artifacts.require('Access');

module.exports = async (deployer, net, accounts) => {
  await deployer.link(AddressSet, Access);
  const access = await deployer.deploy(Access);
  await access.initialize(accounts[3]);
};
