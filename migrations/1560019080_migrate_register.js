const HashSetLib = artifacts.require('HashSetLib');
const Register = artifacts.require('Register');

module.exports = async (deployer, net, accounts) => {
  await deployer.link(HashSetLib, Register);
  await deployer.deploy(Register);
};
