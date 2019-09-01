const Registry = artifacts.require('Registry');
const Accountable = artifacts.require('Accountable');
const Token = artifacts.require('Token');

module.exports = async (deployer, net, accounts) => {
  await deployer.link(Accountable, Token);
  const reg = await Registry.deployed();
  const token = await deployer.deploy(Token);
  await token.initialize(reg.address);
  await reg.setTokenContract(token.address, { from: accounts[3] });
};
