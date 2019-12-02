const AddressSetLib = artifacts.require('AddressSetLib'),
  HashSetLib = artifacts.require('HashSetLib'),
  AccountLib = artifacts.require('AccountLib'),
  OrderLib = artifacts.require('OrderLib'),
  GrantLib = artifacts.require('GrantLib'),
  XferOrderLib = artifacts.require('XferOrderLib'),
  XferGrantLib = artifacts.require('XferGrantLib');

module.exports = async deployer => {
  await Promise.all(
    [AddressSetLib, HashSetLib, AccountLib, OrderLib, GrantLib, XferOrderLib, XferGrantLib].map(v =>
      deployer.deploy(v)
    )
  );
};
