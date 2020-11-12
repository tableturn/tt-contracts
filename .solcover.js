module.exports = {
  copyPackages: [
    '@openzeppelin/contracts',
    '@openzeppelin/contracts-ethereum-package',
    '@openzeppelin/upgrades',
    '@truffle/contract'
  ],
  skipFiles: [
    'Migrations.sol',
    'OldV1XferGrantLib.sol',
    'OldV1XferOrderLib.sol',
    'mocks/AccountLibTester.sol',
    'mocks/AddressSetLibTester.sol',
    'mocks/GrantLibTester.sol',
    'mocks/HashSetLibTester.sol',
    'mocks/OrderLibTester.sol',
    'mocks/TokenMock.sol',
    'mocks/TransactMock.sol',
    'mocks/XferGrantLibTester.sol',
    'mocks/XferOrderLibTester.sol'
  ]
};
