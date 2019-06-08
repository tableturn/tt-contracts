const Migrations = artifacts.require('Migrations');

module.exports = async (deployer, net, accounts) => {
  await deployer.deploy(Migrations);
};
