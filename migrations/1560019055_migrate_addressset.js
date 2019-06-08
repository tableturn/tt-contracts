const AddressSet = artifacts.require('AddressSet');

module.exports = async deployer => {
  await deployer.deploy(AddressSet);
};
