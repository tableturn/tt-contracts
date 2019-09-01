const HashSet = artifacts.require('HashSet');

module.exports = async deployer => {
  await deployer.deploy(HashSet);
};
