module.exports = {
  copyPackages: ['@openzeppelin/contracts', '@openzeppelin/upgrades', '@truffle/contract'],
  skipFiles: [
    'Migrations.sol',
    'mocks/AccountLibTester.sol',
    'mocks/TokenMock.sol',
    'mocks/TransactMock.sol',
    'mocks/XferGrantLibTester.sol',
    'mocks/XferOrderLibTester.sol'
  ]
};
