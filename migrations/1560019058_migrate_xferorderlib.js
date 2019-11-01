const XferOrderLib = artifacts.require('XferOrderLib');

module.exports = async deployer => {
  await deployer.deploy(XferOrderLib);
};
