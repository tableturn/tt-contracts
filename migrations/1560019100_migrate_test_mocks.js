// AddressSetLib
const AddressSetLib = artifacts.require('AddressSetLib');
const AddressSetLibTester = artifacts.require('AddressSetLibTester');
// HashSetLib
const HashSetLib = artifacts.require('HashSetLib');
const HashSetLibTester = artifacts.require('HashSetLibTester');
// OrderLib
const OrderLib = artifacts.require('OrderLib');
const OrderLibTester = artifacts.require('OrderLibTester');
// GrantLib
const GrantLib = artifacts.require('GrantLib');
const GrantLibTester = artifacts.require('GrantLibTester');
// XferOrderLib
const XferOrderLib = artifacts.require('XferOrderLib');
const XferOrderLibTester = artifacts.require('XferOrderLibTester');
// XferGrantLib
const XferGrantLib = artifacts.require('XferGrantLib');
const XferGrantLibTester = artifacts.require('XferGrantLibTester');

module.exports = async (deployer, net, accounts) => {
  // AddressSetLib
  await deployer.link(AddressSetLib, AddressSetLibTester);
  await deployer.deploy(AddressSetLibTester);
  // HashSetLib
  await deployer.link(HashSetLib, HashSetLibTester);
  await deployer.deploy(HashSetLibTester);
  // OrderLib
  await deployer.link(OrderLib, OrderLibTester);
  await deployer.deploy(OrderLibTester);
  // GrantLib
  await deployer.link(GrantLib, GrantLibTester);
  await deployer.deploy(GrantLibTester);
  // XferOrderLib
  await deployer.link(XferOrderLib, XferOrderLibTester);
  await deployer.deploy(XferOrderLibTester);
  // XferGrantLib
  await deployer.link(XferGrantLib, XferGrantLibTester);
  await deployer.deploy(XferGrantLibTester);
};
