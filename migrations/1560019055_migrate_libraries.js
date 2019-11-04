const AddressSetLib = artifacts.require('AddressSetLib'),
  HashSetLib = artifacts.require('HashSetLib'),
  AccountLib = artifacts.require('AccountLib'),
  XferOrderLib = artifacts.require('XferOrderLib'),
  XferGrantLib = artifacts.require('XferGrantLib');

module.exports = async deployer => {
  await Promise.all(
    [AddressSetLib, HashSetLib, AccountLib, XferOrderLib, XferGrantLib].map(v => deployer.deploy(v))
  );
};
