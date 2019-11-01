require('ts-node/register');
require('dotenv').config();
const HDWalletProvider = require('truffle-hdwallet-provider');

const hdWallet = host => {
  return new HDWalletProvider(require(`./conf/keys.${process.env.NETWORK_ID}`), host, 0, 4);
};

module.exports = {
  // All the networks we use.
  networks: {
    development: {
      host: 'localhost',
      port: '7545',
      network_id: '5777',
      gas: 94000000,
      gas_price: 0x01
    },
    // Coverage network config.
    coverage: {
      host: 'localhost',
      network_id: '*',
      port: 8555,
      gas: 0xfffffffffff,
      gasPrice: 0x01
    },
    // Production network.
    cv: {
      provider: () => hdWallet('https://chain.consilienceventures.com'),
      network_id: '18021982',
      gas: 0x59a5380,
      gas_price: 0x01
    },
    // Staging network.
    cv_dev: {
      provider: () => hdWallet('https://chain.dev.consilienceventures.com'),
      network_id: '18021981',
      gas: 94000000,
      gas_price: 0x01
    }
  },

  // Mocha configuration.
  mocha: {
    reporter: 'eth-gas-reporter',
    reporterOptions: {
      excludeContracts: [
        'Migrations.sol',
        'mocks/AccountLibTester.sol',
        'mocks/TokenMock.sol',
        'mocks/TransactMock.sol',
        'mocks/XferGrantLibTester.sol',
        'mocks/XferOrderLibTester.sol'
      ]
    }
  },
  // Configure your compilers
  compilers: {
    solc: {
      version: '0.5.9',
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  }
};
