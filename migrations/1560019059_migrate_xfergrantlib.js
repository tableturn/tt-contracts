const XferGrantLib = artifacts.require('XferGrantLib');

module.exports = async deployer => {
  await deployer.deploy(XferGrantLib);
};
