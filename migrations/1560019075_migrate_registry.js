const Access = artifacts.require('Access');
const Registry = artifacts.require('Registry');

module.exports = async deployer => {
  const access = await Access.deployed();
  const reg = await deployer.deploy(Registry);
  await reg.initialize(access.address);
};
