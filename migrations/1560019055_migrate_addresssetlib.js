const AddressSetLib = artifacts.require('AddressSetLib');

module.exports = async deployer => {
  await deployer.deploy(AddressSetLib);
};
