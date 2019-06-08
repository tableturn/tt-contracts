const Accountable = artifacts.require('Accountable');

module.exports = async deployer => {
  await deployer.deploy(Accountable);
};
