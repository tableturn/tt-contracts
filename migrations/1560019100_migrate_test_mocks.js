// AddressSetLib
const AddressSetLib = artifacts.require('AddressSetLib');
const AddressSetLibTester = artifacts.require('AddressSetLibTester');
// HashSetLib
const HashSetLib = artifacts.require('HashSetLib');
const HashSetLibTester = artifacts.require('HashSetLibTester');

module.exports = async (deployer, net, accounts) => {
  // AddressSetLib
  await deployer.link(AddressSetLib, AddressSetLibTester);
  await deployer.deploy(AddressSetLibTester);
  // HashSetLib
  await deployer.link(HashSetLib, HashSetLibTester);
  await deployer.deploy(HashSetLibTester);
};
