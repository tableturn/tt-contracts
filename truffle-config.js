require('ts-node/register');
require('dotenv').config();
const HDWalletProvider = require('@truffle/hdwallet-provider');

const hdWallet = host => {
  return new HDWalletProvider(require(`./conf/keys.${process.env.NETWORK_ID}`), host, 0, 4);
};

module.exports = {
  plugins: ["solidity-coverage"],
  // All the networks we use.
  networks: {
    development: {
      host: 'localhost',
      port: '7545',
      network_id: '5777',
      // gas: "0x59a5380",
      // gas_price: 0x01
    },
    // Coverage network config.
    coverage: {
      host: 'localhost',
      network_id: '*',
      port: 8555,
      // gas: "0xfffffffffff",
      // gasPrice: 0x01
    },
    // Production network.
    cv: {
      provider: () => hdWallet('https://chain.consilienceventures.com'),
      network_id: '18021982',
      // Find using `web3.eth.getBlock("pending")`.
      // gas: "0x598ecec",
      // gas_price: 1
    },
    // Staging network.
    cv_dev: {
      provider: () => hdWallet('https://chain.dev.consilienceventures.com'),
      network_id: '18021981',
      // Find using `web3.eth.getBlock("pending")`.
      // gas: "0x59a5380",
      // gas_price: 1
    }
  },

  // Configure your compilers
  compilers: {
    solc: {
      version: '0.8.4',
      optimizer: {
        enabled: true,
        runs: 500
      }
    }
  }
};
