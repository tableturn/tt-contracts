const AccountLib = artifacts.require('AccountLib');

module.exports = async deployer => {
  await deployer.deploy(AccountLib);
};
