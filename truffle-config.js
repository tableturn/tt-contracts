require('ts-node/register');
require('dotenv').config();
const HDWalletProvider = require('@truffle/hdwallet-provider');

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
      gas_price: 1
    },
    // Production network.
    cv: {
      provider: () => hdWallet('https://chain.consilienceventures.com'),
      network_id: '18021982',
      gas: 94000000,
      gas_price: 1
    },
    // Staging network.
    cv_dev: {
      provider: () => hdWallet('https://chain.dev.consilienceventures.com'),
      network_id: '18021981',
      gas: 94000000,
      gas_price: 1
    }
  },

  // Mocha configuration.
  mocha: {},

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
