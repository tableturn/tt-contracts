const HashSet = artifacts.require('HashSet');
const Register = artifacts.require('Register');

module.exports = async (deployer, net, accounts) => {
  await deployer.link(HashSet, Register);
  await deployer.deploy(Register);
};
