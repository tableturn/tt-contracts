const HashSetLib = artifacts.require('HashSetLib');

module.exports = async deployer => {
  await deployer.deploy(HashSetLib);
};
